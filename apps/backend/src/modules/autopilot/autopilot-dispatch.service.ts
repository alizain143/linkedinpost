import { Injectable, Logger } from '@nestjs/common';
import { AutopilotConfig, PostSource } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_TIMEZONE,
  getTodayDateKey,
} from '../calendar/calendar-date.util';
import {
  getIsoWeekdayFromDateKey,
  localDateTimeToUtc,
} from '../calendar-generation/calendar-schedule.util';
import { CouncilJobService } from '../council/council-job.service';
import { CreditsService } from '../credits/credits.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import {
  readDayProfileOverrides,
  resolveProfileIdForWeekday,
} from './autopilot-profile.util';
import {
  AUTOPILOT_CREDIT_COST,
  nextPillarIndex,
  resolveTopicFromPillar,
} from './autopilot-schedule.util';

export interface AutopilotDispatchResult {
  success: boolean;
  nextPillarIndex?: number;
  pausedForCredits?: boolean;
}

@Injectable()
export class AutopilotDispatchService {
  private readonly logger = new Logger(AutopilotDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
    private readonly councilJobService: CouncilJobService,
    private readonly enqueueService: GenerationJobEnqueueService,
    private readonly notificationEvents: NotificationEventService,
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

    const balance = await this.creditsService.getBalance(ownerId, now);
    if (balance.remaining < AUTOPILOT_CREDIT_COST) {
      this.logger.warn(
        `Pausing autopilot for workspace ${config.workspaceId}: insufficient credits (${balance.remaining}/${AUTOPILOT_CREDIT_COST})`,
      );
      await this.pauseForInsufficientCredits(
        config,
        ownerId,
        balance.remaining,
        timezone,
        now,
      );
      return { success: false, pausedForCredits: true };
    }

    const todayKey = getTodayDateKey(timezone || DEFAULT_TIMEZONE, now);
    const weekday = getIsoWeekdayFromDateKey(todayKey, timezone);
    const dayProfileOverrides = readDayProfileOverrides(
      config.dayProfileOverrides,
    );
    const profileId = resolveProfileIdForWeekday(
      weekday,
      config.contentProfileId,
      dayProfileOverrides,
    );

    const profile = await this.resolveContentProfile(
      config.workspaceId,
      profileId,
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

  private async pauseForInsufficientCredits(
    config: AutopilotConfig,
    ownerId: string,
    remaining: number,
    timezone: string,
    now: Date,
  ) {
    await this.prisma.autopilotConfig.updateMany({
      where: { id: config.id, enabled: true, ...NOT_DELETED },
      data: { enabled: false },
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: config.workspaceId },
      select: { name: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { plan: true },
    });

    const todayKey = getTodayDateKey(timezone || DEFAULT_TIMEZONE, now);

    await this.notificationEvents.emitAutopilotPausedCredits({
      userId: ownerId,
      workspaceId: config.workspaceId,
      workspaceName: workspace?.name,
      plan: user?.plan ?? 'free',
      remaining,
      required: AUTOPILOT_CREDIT_COST,
      dedupeKey: `autopilot_paused_credits:${config.id}:${todayKey}`,
    });
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
