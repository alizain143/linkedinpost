import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AutopilotApprovalMode,
  PostPackageStatus,
  PostSource,
  Prisma,
} from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_TIMEZONE } from '../calendar/calendar-date.util';
import { LinkedInConnectionService } from '../linkedin/linkedin.services';
import { toPostPackageResponse } from '../posts/post.mapper';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  toAutopilotConfigResponse,
  toAutopilotPublishState,
} from './autopilot.mapper';
import {
  collectReferencedProfileIds,
  DayProfileOverrides,
  parseDayProfileOverrides,
  readDayProfileOverrides,
} from './autopilot-profile.util';
import {
  DEFAULT_POSTING_DAYS,
  DEFAULT_POSTING_TIME,
  resolvePostingDaysForPreset,
} from './autopilot-schedule.util';
import { UpsertAutopilotConfigDto } from './dto/upsert-autopilot-config.dto';

const PLANNED_STATUSES: PostPackageStatus[] = [
  PostPackageStatus.ready_for_approval,
  PostPackageStatus.approved,
  PostPackageStatus.scheduled,
];

@Injectable()
export class AutopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly planFeatureService: PlanFeatureService,
    private readonly linkedInConnectionService: LinkedInConnectionService,
  ) {}

  async getConfig(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const { timezone } = await this.loadWorkspaceOwnerTimezone(workspaceId);
    const config = await this.findOrCreateConfig(workspaceId);
    return toAutopilotConfigResponse(config, timezone);
  }

  async upsertConfig(
    workspaceId: string,
    userId: string,
    dto: UpsertAutopilotConfigDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const dayProfileOverrides = dto.dayProfileOverrides
      ? parseDayProfileOverrides(dto.dayProfileOverrides)
      : undefined;

    if (dto.contentProfileId) {
      await this.assertProfileInWorkspace(workspaceId, dto.contentProfileId);
    }

    if (dayProfileOverrides) {
      for (const profileId of Object.values(dayProfileOverrides)) {
        await this.assertProfileInWorkspace(workspaceId, profileId);
      }
    }

    const existing = await this.prisma.autopilotConfig.findFirst({
      where: { workspaceId, ...NOT_DELETED },
    });

    const postingDays = this.resolvePostingDays(dto, existing?.postingDays);
    const postingTime =
      dto.postingTime ?? existing?.postingTime ?? DEFAULT_POSTING_TIME;

    if (postingDays.length === 0) {
      throw new BadRequestException({
        error: 'At least one posting day is required',
        code: 'VALIDATION_ERROR',
      });
    }

    const willBeEnabled = dto.enabled ?? existing?.enabled ?? false;
    const contentProfileId =
      dto.contentProfileId ?? existing?.contentProfileId ?? null;
    const resolvedOverrides =
      dayProfileOverrides !== undefined
        ? dayProfileOverrides
        : readDayProfileOverrides(existing?.dayProfileOverrides ?? null);
    const approvalMode =
      dto.approvalMode ?? existing?.approvalMode ?? AutopilotApprovalMode.require_approval;

    if (willBeEnabled) {
      const { ownerId } = await this.loadWorkspaceOwnerTimezone(workspaceId);
      await this.planFeatureService.assertAllows(ownerId, 'autopilot');
      await this.assertProfilesHavePillars(
        workspaceId,
        contentProfileId,
        resolvedOverrides,
      );

      if (approvalMode === AutopilotApprovalMode.auto_schedule) {
        await this.assertLinkedInPublishReady(workspaceId, userId);
      }
    }

    const config = await this.prisma.autopilotConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        enabled: dto.enabled ?? false,
        postingDays,
        postingTime,
        contentProfileId: dto.contentProfileId ?? null,
        dayProfileOverrides: dayProfileOverrides
          ? (dayProfileOverrides as Prisma.InputJsonValue)
          : undefined,
        approvalMode:
          dto.approvalMode ?? AutopilotApprovalMode.require_approval,
      },
      update: {
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.postingDays !== undefined || dto.postingPreset !== undefined
          ? { postingDays }
          : {}),
        ...(dto.postingTime !== undefined
          ? { postingTime: dto.postingTime }
          : {}),
        ...(dto.contentProfileId !== undefined
          ? { contentProfileId: dto.contentProfileId }
          : {}),
        ...(dayProfileOverrides !== undefined
          ? {
              dayProfileOverrides:
                dayProfileOverrides === null
                  ? Prisma.JsonNull
                  : (dayProfileOverrides as Prisma.InputJsonValue),
            }
          : {}),
        ...(dto.approvalMode !== undefined
          ? { approvalMode: dto.approvalMode }
          : {}),
      },
    });

    const { timezone } = await this.loadWorkspaceOwnerTimezone(workspaceId);
    return toAutopilotConfigResponse(config, timezone);
  }

  async getPlannedPosts(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const posts = await this.prisma.postPackage.findMany({
      where: {
        workspaceId,
        ...NOT_DELETED,
        source: PostSource.autopilot,
        scheduledAt: { gte: new Date() },
        status: { in: PLANNED_STATUSES },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    return posts.map((post) => ({
      ...toPostPackageResponse(post),
      publishState: toAutopilotPublishState(post.status),
    }));
  }

  private resolvePostingDays(
    dto: UpsertAutopilotConfigDto,
    existingDays?: number[],
  ): number[] {
    if (dto.postingDays !== undefined) {
      return dto.postingDays;
    }

    if (dto.postingPreset !== undefined) {
      return resolvePostingDaysForPreset(dto.postingPreset);
    }

    return existingDays ?? [...DEFAULT_POSTING_DAYS];
  }

  private async findOrCreateConfig(workspaceId: string) {
    const existing = await this.prisma.autopilotConfig.findFirst({
      where: { workspaceId, ...NOT_DELETED },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.autopilotConfig.create({
      data: {
        workspaceId,
        enabled: false,
        postingDays: [...DEFAULT_POSTING_DAYS],
        postingTime: DEFAULT_POSTING_TIME,
      },
    });
  }

  private async loadWorkspaceOwnerTimezone(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      include: { owner: true },
    });

    return {
      timezone: workspace.owner.timezone || DEFAULT_TIMEZONE,
      ownerId: workspace.ownerId,
    };
  }

  private async assertProfileInWorkspace(
    workspaceId: string,
    profileId: string,
  ): Promise<void> {
    const profile = await this.prisma.contentProfile.findFirst({
      where: { id: profileId, workspaceId, ...NOT_DELETED },
    });

    if (!profile) {
      throw new NotFoundException({
        error: 'Content profile not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }
  }

  private async assertProfilesHavePillars(
    workspaceId: string,
    contentProfileId: string | null,
    dayProfileOverrides: DayProfileOverrides | null,
  ): Promise<void> {
    const profileIds = collectReferencedProfileIds(
      contentProfileId,
      dayProfileOverrides,
    );

    if (profileIds.length === 0) {
      await this.assertDefaultProfileHasPillars(workspaceId);
      return;
    }

    for (const profileId of profileIds) {
      const profile = await this.prisma.contentProfile.findFirst({
        where: { id: profileId, workspaceId, ...NOT_DELETED },
        include: { pillars: true },
      });

      if (!profile) {
        throw new NotFoundException({
          error: 'Content profile not found',
          code: 'RESOURCE_NOT_FOUND',
        });
      }

      if (profile.pillars.length === 0) {
        throw new BadRequestException({
          error:
            'Add at least one content pillar to your profile before enabling autopilot',
          code: 'AUTOPILOT_NO_PILLARS',
        });
      }
    }
  }

  private async assertDefaultProfileHasPillars(
    workspaceId: string,
  ): Promise<void> {
    const profile =
      (await this.prisma.contentProfile.findFirst({
        where: { workspaceId, isDefault: true, ...NOT_DELETED },
        include: { pillars: true },
      })) ??
      (await this.prisma.contentProfile.findFirst({
        where: { workspaceId, ...NOT_DELETED },
        include: { pillars: true },
        orderBy: { createdAt: 'asc' },
      }));

    if (!profile) {
      throw new BadRequestException({
        error: 'Add a content profile before enabling autopilot',
        code: 'AUTOPILOT_NO_CONTENT_PROFILE',
      });
    }

    if (profile.pillars.length === 0) {
      throw new BadRequestException({
        error:
          'Add at least one content pillar to your profile before enabling autopilot',
        code: 'AUTOPILOT_NO_PILLARS',
      });
    }
  }

  private async assertLinkedInPublishReady(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const connection =
      await this.linkedInConnectionService.getWorkspaceConnection(
        workspaceId,
        userId,
      );

    if (!connection.connected || !connection.publishReady) {
      throw new BadRequestException({
        error:
          'Connect LinkedIn with publish permission before enabling auto-schedule',
        code: 'LINKEDIN_NOT_CONNECTED',
      });
    }
  }
}
