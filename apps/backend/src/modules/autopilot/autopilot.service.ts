import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostPackageStatus, PostSource } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_TIMEZONE } from '../calendar/calendar-date.util';
import { toPostPackageResponse } from '../posts/post.mapper';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { toAutopilotConfigResponse } from './autopilot.mapper';
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

    if (dto.contentProfileId) {
      const profile = await this.prisma.contentProfile.findFirst({
        where: { id: dto.contentProfileId, workspaceId, ...NOT_DELETED },
      });
      if (!profile) {
        throw new NotFoundException({
          error: 'Content profile not found',
          code: 'RESOURCE_NOT_FOUND',
        });
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

    if (willBeEnabled) {
      const { ownerId } = await this.loadWorkspaceOwnerTimezone(workspaceId);
      await this.planFeatureService.assertAllows(ownerId, 'autopilot');
      await this.assertContentProfileHasPillars(workspaceId, contentProfileId);
    }

    const config = await this.prisma.autopilotConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        enabled: dto.enabled ?? false,
        postingDays,
        postingTime,
        contentProfileId: dto.contentProfileId ?? null,
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

    return posts.map((post) => toPostPackageResponse(post));
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

  private async assertContentProfileHasPillars(
    workspaceId: string,
    contentProfileId: string | null,
  ): Promise<void> {
    const profile = contentProfileId
      ? await this.prisma.contentProfile.findFirst({
          where: { id: contentProfileId, workspaceId, ...NOT_DELETED },
          include: { pillars: true },
        })
      : await this.prisma.contentProfile.findFirst({
          where: { workspaceId, isDefault: true, ...NOT_DELETED },
          include: { pillars: true },
        }) ??
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
}
