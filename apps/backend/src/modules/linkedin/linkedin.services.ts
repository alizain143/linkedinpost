import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, WorkspaceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ClerkOAuthService } from './clerk-oauth.service';
import { LinkedInOAuthService } from './linkedin-oauth.service';
import { LINKEDIN_PUBLISH_SCOPE } from './linkedin.constants';
import {
  LinkedInConnectionStatus,
  LinkedInProfileData,
} from './linkedin.types';
import { mergeApiSyncPreservingImport } from './profile-import.merge';
import { buildPostCommentary, LinkedInApiClient } from './linkedin-api.client';
import {
  bindWorkspaceLinkedInUpdate,
  CLEAR_WORKSPACE_LINKEDIN_UPDATE,
  loadWorkspaceLinkedIn,
  syncWorkspaceLinkedInUpdate,
} from './workspace-linkedin.store';
import { LinkedInPublishError } from './linkedin-publish.error';
import {
  assertPublishTransition,
  PUBLISH_SOURCE_STATUSES,
} from './publish-status.transitions';
import { PostPackageStatus } from '@prisma/client';
import { toPostPackageResponse } from '../posts/post.mapper';
import { MediaService } from '../media/media.service';
import { NotificationEventService } from '../notifications/notification-event.service';

@Injectable()
export class LinkedInConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkOAuthService: ClerkOAuthService,
    private readonly linkedInOAuthService: LinkedInOAuthService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  private buildConnectionStatus(
    account: {
      id?: string;
      firstName?: string | null;
      lastName?: string | null;
      username?: string | null;
      emailAddress?: string | null;
      approvedScopes?: string;
    } | null,
    linkedInMemberId: string | null,
    clerkExternalAccountId?: string | null,
  ): LinkedInConnectionStatus {
    const approvedScopes = this.clerkOAuthService.getApprovedScopes(account);
    const connected = Boolean(account);
    const publishReady = this.clerkOAuthService.hasPublishScope(approvedScopes);

    const profileName = account
      ? [account.firstName, account.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        account.username ||
        account.emailAddress ||
        null
      : null;

    return {
      connected,
      publishReady,
      profileName: profileName || null,
      approvedScopes,
      linkedInMemberId,
      clerkExternalAccountId:
        clerkExternalAccountId ?? account?.id ?? null,
    };
  }

  async getConnection(userId: string): Promise<LinkedInConnectionStatus> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        error: 'User not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const account = await this.clerkOAuthService.getLinkedInExternalAccount(
      user.clerkId,
    );

    return this.buildConnectionStatus(account, user.linkedInMemberId);
  }

  async getWorkspaceConnection(
    workspaceId: string,
    userId: string,
  ): Promise<LinkedInConnectionStatus> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: workspace.ownerId },
    });

    if (this.linkedInOAuthService.workspaceHasStoredToken(workspace)) {
      let publishReady = false;
      try {
        publishReady = Boolean(
          await this.linkedInOAuthService.getWorkspaceAccessToken(workspaceId),
        );
      } catch {
        publishReady = false;
      }

      return {
        connected: publishReady,
        publishReady,
        profileName: workspace.linkedInProfileName,
        approvedScopes: publishReady ? [LINKEDIN_PUBLISH_SCOPE] : [],
        linkedInMemberId: workspace.linkedInMemberId,
        clerkExternalAccountId: null,
      };
    }

    if (workspace.linkedInClerkExternalAccountId) {
      const account = await this.clerkOAuthService.getLinkedInExternalAccount(
        owner.clerkId,
        workspace.linkedInClerkExternalAccountId,
      );

      if (!account) {
        return {
          connected: false,
          publishReady: false,
          profileName: workspace.linkedInProfileName,
          approvedScopes: [],
          linkedInMemberId: workspace.linkedInMemberId,
          clerkExternalAccountId: workspace.linkedInClerkExternalAccountId,
        };
      }

      return this.buildConnectionStatus(
        account,
        workspace.linkedInMemberId,
        workspace.linkedInClerkExternalAccountId,
      );
    }

    if (workspace.type === WorkspaceType.personal) {
      const verifiedAccounts =
        await this.clerkOAuthService.listVerifiedLinkedInExternalAccounts(
          owner.clerkId,
        );
      if (verifiedAccounts.length <= 1) {
        return this.getConnection(userId);
      }
    }

    return {
      connected: false,
      publishReady: false,
      profileName: null,
      approvedScopes: [],
      linkedInMemberId: null,
      clerkExternalAccountId: null,
    };
  }

  async bindWorkspaceConnection(
    workspaceId: string,
    userId: string,
    clerkExternalAccountId?: string,
  ): Promise<LinkedInConnectionStatus> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: workspace.ownerId },
    });

    const account = await this.clerkOAuthService.getLinkedInExternalAccount(
      owner.clerkId,
      clerkExternalAccountId,
    );
    if (!account) {
      throw new NotFoundException({
        error: 'LinkedIn is not connected in Clerk',
        code: 'LINKEDIN_NOT_CONNECTED',
      });
    }

    const profileName =
      [account.firstName, account.lastName].filter(Boolean).join(' ').trim() ||
      account.username ||
      account.emailAddress ||
      null;

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: bindWorkspaceLinkedInUpdate(account.id, profileName),
    });

    return this.getWorkspaceConnection(workspaceId, userId);
  }

  async disconnectWorkspaceConnection(
    workspaceId: string,
    userId: string,
  ): Promise<LinkedInConnectionStatus> {
    await this.workspacesService.assertMember(userId, workspaceId);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: CLEAR_WORKSPACE_LINKEDIN_UPDATE,
    });

    return this.getWorkspaceConnection(workspaceId, userId);
  }
}

@Injectable()
export class LinkedInProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkOAuthService: ClerkOAuthService,
    private readonly linkedInOAuthService: LinkedInOAuthService,
    private readonly linkedInApiClient: LinkedInApiClient,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getProfile(userId: string): Promise<LinkedInProfileData | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.linkedInProfile) return null;
    return user.linkedInProfile as unknown as LinkedInProfileData;
  }

  async getWorkspaceProfile(
    workspaceId: string,
    userId: string,
  ): Promise<LinkedInProfileData | null> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);

    if (workspace.linkedInProfile) {
      return workspace.linkedInProfile as unknown as LinkedInProfileData;
    }

    if (workspace.type === WorkspaceType.personal) {
      return this.getProfile(userId);
    }

    return null;
  }

  async syncProfile(userId: string): Promise<LinkedInProfileData> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const accessToken = await this.clerkOAuthService.getLinkedInAccessToken(
      user.clerkId,
    );

    const profile = await this.fetchAndMapProfile(accessToken);

    const existing = user.linkedInProfile as LinkedInProfileData | null;
    const merged = mergeApiSyncPreservingImport(existing, profile);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        linkedInMemberId: merged.memberId,
        linkedInProfileSyncedAt: new Date(),
        linkedInProfile: merged as unknown as Prisma.InputJsonValue,
      },
    });

    return merged;
  }

  async syncWorkspaceProfile(
    workspaceId: string,
    userId: string,
  ): Promise<LinkedInProfileData> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: workspace.ownerId },
    });

    if (
      !this.linkedInOAuthService.workspaceHasStoredToken(workspace) &&
      !workspace.linkedInClerkExternalAccountId &&
      workspace.type === WorkspaceType.personal
    ) {
      const verifiedAccounts =
        await this.clerkOAuthService.listVerifiedLinkedInExternalAccounts(
          owner.clerkId,
        );
      if (verifiedAccounts.length <= 1) {
        return this.syncProfile(userId);
      }
    }

    if (
      !this.linkedInOAuthService.workspaceHasStoredToken(workspace) &&
      !workspace.linkedInClerkExternalAccountId
    ) {
      throw new NotFoundException({
        error: 'LinkedIn is not connected for this workspace',
        code: 'LINKEDIN_NOT_CONNECTED',
      });
    }

    const accessToken = await this.resolveWorkspaceAccessToken(
      workspaceId,
      workspace,
      owner.clerkId,
    );

    const profile = await this.fetchAndMapProfile(accessToken);

    const existing = workspace.linkedInProfile as LinkedInProfileData | null;
    const merged = mergeApiSyncPreservingImport(existing, profile);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: syncWorkspaceLinkedInUpdate(
        merged.memberId,
        merged.fullName,
        merged as unknown as Prisma.InputJsonValue,
      ),
    });

    return merged;
  }

  private async fetchAndMapProfile(accessToken: string) {
    const userinfo = await this.linkedInApiClient.fetchUserInfo(accessToken);
    let identityMe: Record<string, unknown> | null = null;
    try {
      identityMe = await this.linkedInApiClient.fetchIdentityMe(accessToken);
    } catch {
      identityMe = null;
    }

    return this.linkedInApiClient.mapProfile(userinfo, identityMe);
  }

  private async resolveWorkspaceAccessToken(
    workspaceId: string,
    workspace: Awaited<ReturnType<typeof loadWorkspaceLinkedIn>>,
    ownerClerkId: string,
  ): Promise<string> {
    const stored =
      await this.linkedInOAuthService.getWorkspaceAccessToken(workspaceId);
    if (stored) return stored;

    return this.clerkOAuthService.getLinkedInAccessToken(
      ownerClerkId,
      workspace.linkedInClerkExternalAccountId,
    );
  }
}

@Injectable()
export class LinkedInPublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkOAuthService: ClerkOAuthService,
    private readonly linkedInOAuthService: LinkedInOAuthService,
    private readonly linkedInApiClient: LinkedInApiClient,
    private readonly linkedInProfileService: LinkedInProfileService,
    private readonly mediaService: MediaService,
    private readonly notificationEvents: NotificationEventService,
  ) {}

  async publishPostForOwner(postPackageId: string, ownerUserId: string) {
    const post = await this.prisma.postPackage.findUniqueOrThrow({
      where: { id: postPackageId },
      include: { _count: { select: { versions: true } } },
    });

    return this.publishPost(post, ownerUserId, post.workspaceId);
  }

  async publishPostForWorkspace(
    postPackageId: string,
    workspaceId: string,
    ownerUserId: string,
  ) {
    const post = await this.prisma.postPackage.findUniqueOrThrow({
      where: { id: postPackageId },
      include: { _count: { select: { versions: true } } },
    });

    if (post.workspaceId !== workspaceId) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return this.publishPost(post, ownerUserId, workspaceId);
  }

  private async publishPost(
    post: Awaited<
      ReturnType<typeof this.prisma.postPackage.findUniqueOrThrow>
    > & { _count: { versions: number } },
    ownerUserId: string,
    workspaceId: string,
  ) {
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerUserId },
    });
    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);

    assertPublishTransition(post.status, post.publishErrorCode);

    const externalAccountId = workspace.linkedInClerkExternalAccountId;
    const hasStoredToken =
      this.linkedInOAuthService.workspaceHasStoredToken(workspace);

    if (!hasStoredToken && !externalAccountId) {
      const verifiedAccounts =
        await this.clerkOAuthService.listVerifiedLinkedInExternalAccounts(
          owner.clerkId,
        );
      if (
        workspace.type !== WorkspaceType.personal ||
        verifiedAccounts.length > 1
      ) {
        throw new UnauthorizedException({
          error: 'LinkedIn is not connected for this workspace',
          code: 'LINKEDIN_NOT_CONNECTED',
        });
      }
    }

    const storedToken =
      await this.linkedInOAuthService.getWorkspaceAccessToken(workspaceId);
    const accessToken =
      storedToken ??
      (await this.clerkOAuthService.getLinkedInAccessToken(
        owner.clerkId,
        externalAccountId,
      ));

    let memberId =
      workspace.linkedInMemberId ??
      (workspace.type === WorkspaceType.personal ? owner.linkedInMemberId : null);
    if (!memberId) {
      const useWorkspaceSync =
        hasStoredToken ||
        Boolean(workspace.linkedInClerkExternalAccountId) ||
        workspace.type !== WorkspaceType.personal;
      const profile = useWorkspaceSync
        ? await this.linkedInProfileService.syncWorkspaceProfile(
            workspaceId,
            ownerUserId,
          )
        : await this.linkedInProfileService.syncProfile(owner.id);
      memberId = profile.memberId;
    }

    const publishing = await this.prisma.postPackage.updateMany({
      where: {
        id: post.id,
        status: { in: PUBLISH_SOURCE_STATUSES },
      },
      data: {
        status: PostPackageStatus.publishing,
        publishAttemptedAt: new Date(),
        publishErrorCode: null,
        publishErrorMessage: null,
        ...(post.status === PostPackageStatus.scheduled
          ? { scheduledAt: null }
          : {}),
      },
    });

    if (publishing.count === 0) {
      throw new ConflictException({
        error: `Cannot publish post in status ${post.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    try {
      const commentary = buildPostCommentary(post);
      const mediaList = await this.mediaService.getPublishMediaList(post.id);
      let result;

      if (mediaList.length >= 2) {
        const ownerUrn = `urn:li:person:${memberId}`;
        const uploaded: { imageUrn: string; altText: string }[] = [];

        for (const media of mediaList) {
          const { uploadUrl, imageUrn } =
            await this.linkedInApiClient.initializeImageUpload({
              accessToken,
              ownerUrn,
            });

          try {
            await this.linkedInApiClient.uploadImageBinary({
              uploadUrl,
              buffer: media.buffer,
              mimeType: media.mimeType,
            });
          } catch (error) {
            throw new LinkedInPublishError(
              error instanceof Error
                ? error.message
                : 'LinkedIn image upload failed',
              'LINKEDIN_IMAGE_UPLOAD_FAILED',
            );
          }

          uploaded.push({ imageUrn, altText: media.altText });
        }

        result = await this.linkedInApiClient.publishPost({
          accessToken,
          memberId,
          commentary,
          multiImage: { images: uploaded },
        });
      } else if (mediaList.length === 1) {
        const media = mediaList[0];
        const ownerUrn = `urn:li:person:${memberId}`;
        const { uploadUrl, imageUrn } =
          await this.linkedInApiClient.initializeImageUpload({
            accessToken,
            ownerUrn,
          });

        try {
          await this.linkedInApiClient.uploadImageBinary({
            uploadUrl,
            buffer: media.buffer,
            mimeType: media.mimeType,
          });
        } catch (error) {
          throw new LinkedInPublishError(
            error instanceof Error
              ? error.message
              : 'LinkedIn image upload failed',
            'LINKEDIN_IMAGE_UPLOAD_FAILED',
          );
        }

        result = await this.linkedInApiClient.publishPost({
          accessToken,
          memberId,
          commentary,
          media: { imageUrn, altText: media.altText },
        });
      } else {
        result = await this.linkedInApiClient.publishPost({
          accessToken,
          memberId,
          commentary,
        });
      }

      const updated = await this.prisma.postPackage.update({
        where: { id: post.id },
        data: {
          status: PostPackageStatus.published,
          publishedAt: new Date(),
          linkedInPostId: result.linkedInPostId,
          linkedInPostUrl: result.linkedInPostUrl,
          publishErrorCode: null,
          publishErrorMessage: null,
        },
        include: { _count: { select: { versions: true } } },
      });

      await this.notificationEvents.emitPublishResult({
        userId: ownerUserId,
        workspaceId: post.workspaceId,
        postPackageId: post.id,
        postHook: post.hook,
        succeeded: true,
      });

      return toPostPackageResponse(updated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'LinkedIn publish failed';
      const code =
        error instanceof LinkedInPublishError
          ? error.code
          : typeof error === 'object' &&
              error &&
              'response' in error &&
              typeof (error as { response?: { code?: string } }).response
                ?.code === 'string'
            ? ((error as { response: { code: string } }).response.code ??
              'LINKEDIN_PUBLISH_FAILED')
            : 'LINKEDIN_PUBLISH_FAILED';

      const failed = await this.prisma.postPackage.update({
        where: { id: post.id },
        data: {
          status: PostPackageStatus.failed,
          publishErrorCode: code,
          publishErrorMessage: message,
        },
        include: { _count: { select: { versions: true } } },
      });

      await this.notificationEvents.emitPublishResult({
        userId: ownerUserId,
        workspaceId: post.workspaceId,
        postPackageId: post.id,
        postHook: post.hook,
        succeeded: false,
      });

      return toPostPackageResponse(failed);
    }
  }
}
