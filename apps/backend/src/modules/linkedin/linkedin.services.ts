import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ClerkOAuthService } from './clerk-oauth.service';
import {
  LinkedInConnectionStatus,
  LinkedInProfileData,
} from './linkedin.types';
import { buildPostCommentary, LinkedInApiClient } from './linkedin-api.client';
import { LinkedInPublishError } from './linkedin-publish.error';
import {
  assertPublishTransition,
  PUBLISH_SOURCE_STATUSES,
} from './publish-status.transitions';
import { PostPackageStatus } from '@prisma/client';
import { toPostPackageResponse } from '../posts/post.mapper';
import { MediaService } from '../media/media.service';

@Injectable()
export class LinkedInConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkOAuthService: ClerkOAuthService,
  ) {}

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
    const approvedScopes = this.clerkOAuthService.getApprovedScopes(account);
    const connected = Boolean(account);
    const publishReady = this.clerkOAuthService.hasPublishScope(approvedScopes);

    const profileName = account
      ? [account.firstName, account.lastName].filter(Boolean).join(' ').trim() ||
        account.username ||
        account.emailAddress ||
        null
      : null;

    return {
      connected,
      publishReady,
      profileName: profileName || null,
      approvedScopes,
      linkedInMemberId: user.linkedInMemberId,
    };
  }
}

@Injectable()
export class LinkedInProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkOAuthService: ClerkOAuthService,
    private readonly linkedInApiClient: LinkedInApiClient,
  ) {}

  async getProfile(userId: string): Promise<LinkedInProfileData | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.linkedInProfile) return null;
    return user.linkedInProfile as unknown as LinkedInProfileData;
  }

  async syncProfile(userId: string): Promise<LinkedInProfileData> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const accessToken = await this.clerkOAuthService.getLinkedInAccessToken(
      user.clerkId,
    );

    const userinfo = await this.linkedInApiClient.fetchUserInfo(accessToken);
    let identityMe: Record<string, unknown> | null = null;
    try {
      identityMe = await this.linkedInApiClient.fetchIdentityMe(accessToken);
    } catch {
      identityMe = null;
    }

    const profile = this.linkedInApiClient.mapProfile(userinfo, identityMe);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        linkedInMemberId: profile.memberId,
        linkedInProfileSyncedAt: new Date(),
        linkedInProfile: profile as unknown as Prisma.InputJsonValue,
      },
    });

    return profile;
  }
}

@Injectable()
export class LinkedInPublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkOAuthService: ClerkOAuthService,
    private readonly linkedInApiClient: LinkedInApiClient,
    private readonly linkedInProfileService: LinkedInProfileService,
    private readonly mediaService: MediaService,
  ) {}

  async publishPostForOwner(postPackageId: string, ownerUserId: string) {
    const owner = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerUserId },
    });

    const post = await this.prisma.postPackage.findUniqueOrThrow({
      where: { id: postPackageId },
      include: { _count: { select: { versions: true } } },
    });

    assertPublishTransition(post.status, post.publishErrorCode);

    const accessToken = await this.clerkOAuthService.getLinkedInAccessToken(
      owner.clerkId,
    );

    let memberId = owner.linkedInMemberId;
    if (!memberId) {
      const profile = await this.linkedInProfileService.syncProfile(owner.id);
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
      const media = await this.mediaService.getPrimaryPublishMedia(post.id);
      let result;

      if (media) {
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

      return toPostPackageResponse(failed);
    }
  }
}
