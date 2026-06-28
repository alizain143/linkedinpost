import { Injectable, Logger } from '@nestjs/common';
import { AutopilotConfig, PostSource } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_TIMEZONE,
  getTodayDateKey,
} from '../calendar/calendar-date.util';
import { localDateTimeToUtc } from '../calendar-generation/calendar-schedule.util';
import { CouncilJobService } from '../council/council-job.service';
import { CreditsService } from '../credits/credits.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import {
  AUTOPILOT_CREDIT_COST,
  nextPillarIndex,
  resolveTopicFromPillar,
} from './autopilot-schedule.util';

export interface AutopilotDispatchResult {
  success: boolean;
  nextPillarIndex?: number;
}

@Injectable()
export class AutopilotDispatchService {
  private readonly logger = new Logger(AutopilotDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
    private readonly councilJobService: CouncilJobService,
    private readonly enqueueService: GenerationJobEnqueueService,
    private readonly planFeatureService: PlanFeatureService,
  ) {}

  async dispatch(
    config: AutopilotConfig,
    ownerId: string,
    timezone: string,
    now = new Date(),
  ): Promise<AutopilotDispatchResult> {
    try {
      this.enqueueService.assertRedisAvailable();
    } catch {
      this.logger.warn(
        `Skipping autopilot dispatch for workspace ${config.workspaceId}: Redis unavailable`,
      );
      return { success: false };
    }

    const hasAutopilot = await this.planFeatureService.hasFeature(
      ownerId,
      'autopilot',
    );
    if (!hasAutopilot) {
      this.logger.warn(
        `Skipping autopilot dispatch for workspace ${config.workspaceId}: owner plan no longer includes autopilot`,
      );
      return { success: false };
    }

    const balance = await this.creditsService.getBalance(ownerId, now);
    if (balance.remaining < AUTOPILOT_CREDIT_COST) {
      this.logger.warn(
        `Skipping autopilot dispatch for workspace ${config.workspaceId}: insufficient credits (${balance.remaining}/${AUTOPILOT_CREDIT_COST})`,
      );
      return { success: false };
    }

    const profile = await this.resolveContentProfile(
      config.workspaceId,
      config.contentProfileId,
    );
    if (!profile) {
      this.logger.warn(
        `Skipping autopilot dispatch for workspace ${config.workspaceId}: no content profile`,
      );
      return { success: false };
    }

    const pillars = profile.pillars.sort((a, b) => a.sortOrder - b.sortOrder);
    if (pillars.length === 0) {
      this.logger.warn(
        `Skipping autopilot dispatch for workspace ${config.workspaceId}: content profile has no pillars`,
      );
      return { success: false };
    }

    const pillarIndex = config.lastPillarIndex % pillars.length;
    const pillar = pillars[pillarIndex];
    const topic = resolveTopicFromPillar(pillar.name);
    const todayKey = getTodayDateKey(timezone || DEFAULT_TIMEZONE, now);
    const scheduledAt = localDateTimeToUtc(
      todayKey,
      config.postingTime,
      timezone || DEFAULT_TIMEZONE,
    );

    await this.councilJobService.enqueueCouncil(
      config.workspaceId,
      ownerId,
      {
        topic,
        pillar: pillar.name,
        contentProfileId: profile.id,
      },
      {
        source: PostSource.autopilot,
        scheduledAt,
        creditCost: AUTOPILOT_CREDIT_COST,
      },
    );

    return {
      success: true,
      nextPillarIndex: nextPillarIndex(pillarIndex, pillars.length),
    };
  }

  private async resolveContentProfile(
    workspaceId: string,
    contentProfileId: string | null,
  ) {
    if (contentProfileId) {
      return this.prisma.contentProfile.findFirst({
        where: { id: contentProfileId, workspaceId, ...NOT_DELETED },
        include: { pillars: true },
      });
    }

    const defaultProfile = await this.prisma.contentProfile.findFirst({
      where: { workspaceId, isDefault: true, ...NOT_DELETED },
      include: { pillars: true },
    });

    if (defaultProfile) {
      return defaultProfile;
    }

    return this.prisma.contentProfile.findFirst({
      where: { workspaceId, ...NOT_DELETED },
      include: { pillars: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
