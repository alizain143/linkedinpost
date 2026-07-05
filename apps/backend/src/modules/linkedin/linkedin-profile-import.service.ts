import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LinkedInApiClient } from './linkedin-api.client';
import { LinkedInOAuthService } from './linkedin-oauth.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ImportLinkedInProfileDto } from './dto/import-linkedin-profile.dto';
import {
  mergeImportedProfile,
  parseExperienceText,
  ProfileImportPayload,
  withApiOnlyEnrichment,
} from './profile-import.merge';
import { ProfileImportTokenService } from './profile-import-token.service';
import {
  extractLinkedInProfileSlug,
  linkedInProfileSlugsMatch,
} from './profile-url.util';
import { LinkedInProfileData } from './linkedin.types';
import {
  loadWorkspaceLinkedIn,
  syncWorkspaceLinkedInUpdate,
} from './workspace-linkedin.store';

const MAX_IMPORTS_PER_HOUR = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

@Injectable()
export class LinkedInProfileImportService {
  private readonly importTimestamps = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly importTokenService: ProfileImportTokenService,
    private readonly linkedInOAuthService: LinkedInOAuthService,
    private readonly linkedInApiClient: LinkedInApiClient,
  ) {}

  createImportToken(
    workspaceId: string,
    userId: string,
    profileUrlHint?: string | null,
  ) {
    return this.createImportTokenAsync(workspaceId, userId, profileUrlHint);
  }

  private async createImportTokenAsync(
    workspaceId: string,
    userId: string,
    profileUrlHint?: string | null,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.assertLinkedInConnected(workspaceId);

    const { token, expiresAt } = this.importTokenService.createToken(
      workspaceId,
      userId,
    );

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    const slug = await this.resolveExpectedSlug(
      workspaceId,
      workspace,
      profileUrlHint,
    );

    if (!slug) {
      throw new BadRequestException({
        error:
          'LinkedIn profile URL is not saved for this workspace yet. Enter the client profile URL (linkedin.com/in/...) to continue.',
        code: 'LINKEDIN_IMPORT_PROFILE_URL_UNKNOWN',
      });
    }

    if (profileUrlHint?.trim()) {
      await this.persistProfileUrlIfMissing(workspaceId, profileUrlHint.trim());
    }

    const workspaceParam = `lp_workspace=${encodeURIComponent(workspaceId)}`;
    const tokenParam = `lp_import=${encodeURIComponent(token)}`;
    const linkedInImportUrl = `https://www.linkedin.com/in/${encodeURIComponent(slug)}?${tokenParam}&${workspaceParam}`;

    return {
      token,
      expiresAt,
      linkedInImportUrl,
      expectedProfileSlug: slug,
      profileName: workspace.linkedInProfileName,
    };
  }

  async importProfile(
    workspaceId: string,
    actorUserId: string | null,
    dto: ImportLinkedInProfileDto,
  ): Promise<LinkedInProfileData> {
    let userId = actorUserId;

    if (dto.importToken) {
      const payload = this.importTokenService.verifyToken(
        dto.importToken,
        workspaceId,
      );
      userId = payload.userId;
    } else if (!userId) {
      throw new BadRequestException({
        error: 'Import token or authentication required',
        code: 'LINKEDIN_IMPORT_UNAUTHORIZED',
      });
    } else {
      await this.workspacesService.assertMember(userId, workspaceId);
    }

    this.assertRateLimit(workspaceId);

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    await this.assertLinkedInConnected(workspaceId, workspace);

    const memberId = workspace.linkedInMemberId;
    if (!memberId) {
      throw new BadRequestException({
        error: 'Sync basic profile before importing',
        code: 'LINKEDIN_PROFILE_NOT_SYNCED',
      });
    }

    this.assertProfileMatches({
      workspace,
      importedProfileUrl: dto.profileUrl,
    });

    const existing = workspace.linkedInProfile as LinkedInProfileData | null;
    const payload = this.buildImportPayload(dto);
    const { profile } = mergeImportedProfile(existing, memberId, payload);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: syncWorkspaceLinkedInUpdate(
        profile.memberId,
        profile.fullName ?? workspace.linkedInProfileName,
        profile as unknown as Prisma.InputJsonValue,
      ),
    });

    return profile;
  }

  private buildImportPayload(dto: ImportLinkedInProfileDto): ProfileImportPayload {
    let positions = dto.positions?.map((p) => ({
      title: p.title ?? null,
      companyName: p.companyName ?? null,
      companyPageUrl: p.companyPageUrl ?? null,
      startedOn: p.startedOn ?? null,
      isCurrent: p.isCurrent ?? false,
    }));

    if ((!positions || positions.length === 0) && dto.experienceText?.trim()) {
      positions = parseExperienceText(dto.experienceText);
    }

    return {
      profileUrl: dto.profileUrl,
      headline: dto.headline,
      summary: dto.summary,
      positions,
      education: dto.education?.map((e) => ({
        schoolName: e.schoolName ?? null,
        degreeName: e.degreeName ?? null,
        fieldOfStudy: e.fieldOfStudy ?? null,
        startedOn: null,
        endedOn: null,
      })),
    };
  }

  private assertProfileMatches(input: {
    workspace: Awaited<ReturnType<typeof loadWorkspaceLinkedIn>>;
    importedProfileUrl: string;
  }) {
    const existing = input.workspace.linkedInProfile as LinkedInProfileData | null;
    const expectedUrl = existing?.profileUrl;

    if (expectedUrl) {
      if (!linkedInProfileSlugsMatch(expectedUrl, input.importedProfileUrl)) {
        throw new ConflictException({
          error:
            'Imported profile does not match the LinkedIn account connected to this workspace',
          code: 'LINKEDIN_IMPORT_PROFILE_MISMATCH',
        });
      }
      return;
    }

    const importedSlug = extractLinkedInProfileSlug(input.importedProfileUrl);
    if (!importedSlug) {
      throw new BadRequestException({
        error: 'Invalid LinkedIn profile URL',
        code: 'LINKEDIN_IMPORT_INVALID_URL',
      });
    }

    // First import without OAuth profileUrl — allow if workspace has a stored memberId only.
    // User must import their own profile page (validated on next sync when profileUrl is set).
  }

  private async assertLinkedInConnected(
    workspaceId: string,
    workspace?: Awaited<ReturnType<typeof loadWorkspaceLinkedIn>>,
  ) {
    const ws =
      workspace ?? (await loadWorkspaceLinkedIn(this.prisma, workspaceId));

    if (
      !ws.linkedInMemberId &&
      !ws.linkedInAccessToken &&
      !ws.linkedInClerkExternalAccountId
    ) {
      throw new NotFoundException({
        error: 'LinkedIn is not connected for this workspace',
        code: 'LINKEDIN_NOT_CONNECTED',
      });
    }
  }

  private async resolveExpectedSlug(
    workspaceId: string,
    workspace?: Awaited<ReturnType<typeof loadWorkspaceLinkedIn>>,
    profileUrlHint?: string | null,
  ): Promise<string | null> {
    const ws =
      workspace ?? (await loadWorkspaceLinkedIn(this.prisma, workspaceId));
    const profile = ws.linkedInProfile as LinkedInProfileData | null;

    if (profileUrlHint?.trim()) {
      const hintSlug = extractLinkedInProfileSlug(profileUrlHint.trim());
      if (hintSlug) return hintSlug;
    }

    if (profile?.profileUrl) {
      return extractLinkedInProfileSlug(profile.profileUrl);
    }

    const accessToken =
      await this.linkedInOAuthService.getWorkspaceAccessToken(workspaceId);
    if (!accessToken) {
      return null;
    }

    try {
      const userinfo = await this.linkedInApiClient.fetchUserInfo(accessToken);
      const identityMe =
        await this.linkedInApiClient.fetchIdentityMe(accessToken);
      const mapped = this.linkedInApiClient.mapProfile(userinfo, identityMe);
      const apiSlug = mapped.profileUrl
        ? extractLinkedInProfileSlug(mapped.profileUrl)
        : null;
      if (apiSlug) {
        await this.persistProfileUrlIfMissing(workspaceId, mapped.profileUrl!);
        return apiSlug;
      }
    } catch {
      return null;
    }

    return null;
  }

  private async persistProfileUrlIfMissing(
    workspaceId: string,
    profileUrl: string,
  ): Promise<void> {
    const slug = extractLinkedInProfileSlug(profileUrl);
    if (!slug) return;

    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    const existing = workspace.linkedInProfile as LinkedInProfileData | null;
    if (existing?.profileUrl) return;

    const normalized = `https://www.linkedin.com/in/${slug}`;
    const memberId = workspace.linkedInMemberId ?? existing?.memberId ?? '';
    if (!memberId) return;

    const base: LinkedInProfileData =
      existing ??
      withApiOnlyEnrichment({
        memberId,
        fullName: workspace.linkedInProfileName,
        firstName: null,
        lastName: null,
        email: null,
        pictureUrl: null,
        headline: null,
        summary: null,
        currentTitle: null,
        currentCompany: null,
        profileUrl: null,
        locale: null,
        positions: [],
        education: [],
        syncedAt: new Date().toISOString(),
      });

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: syncWorkspaceLinkedInUpdate(
        memberId,
        base.fullName ?? workspace.linkedInProfileName,
        { ...base, profileUrl: normalized } as unknown as Prisma.InputJsonValue,
      ),
    });
  }

  private assertRateLimit(workspaceId: string) {
    const now = Date.now();
    const timestamps = this.importTimestamps.get(workspaceId) ?? [];
    const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);

    if (recent.length >= MAX_IMPORTS_PER_HOUR) {
      throw new HttpException(
        {
          error: 'Too many profile imports. Try again later.',
          code: 'LINKEDIN_IMPORT_RATE_LIMIT',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.importTimestamps.set(workspaceId, recent);
  }
}
