import { Injectable } from '@nestjs/common';
import { GenerationJobType, Prisma } from '@prisma/client';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { toGenerationJobResponse } from '../generation/generation-job.mapper';
import { CalendarInput } from '../generation/generation.types';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  buildCalendarSlotDates,
  calendarCreditCost,
  calendarSlotCount,
  DEFAULT_POSTING_DAYS,
  DEFAULT_POSTING_TIME,
  resolveStartDateKey,
} from './calendar-schedule.util';
import { CalendarGenerateRequestDto } from './dto/calendar-generate-request.dto';

@Injectable()
export class CalendarJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly creditsService: CreditsService,
    private readonly enqueueService: GenerationJobEnqueueService,
    private readonly planFeatureService: PlanFeatureService,
  ) {}

  async enqueueCalendar(
    workspaceId: string,
    userId: string,
    dto: CalendarGenerateRequestDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    this.enqueueService.assertRedisAvailable();

    if (dto.durationDays === 30) {
      await this.planFeatureService.assertAllows(userId, 'calendar_30_day');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const timezone = user.timezone || 'America/New_York';
    const postingTime = dto.postingTime ?? DEFAULT_POSTING_TIME;
    const postingDays = dto.postingDays ?? [...DEFAULT_POSTING_DAYS];
    const slotCount = calendarSlotCount(dto.durationDays);
    const slotGenerationMode = dto.slotGenerationMode ?? 'quick_draft';
    const creditCost = calendarCreditCost(dto.durationDays, slotGenerationMode, {
      mediaFormat: dto.mediaFormat,
      carouselSlideCount: dto.carouselSlideCount,
    });

    await this.creditsService.assertHasCredits(userId, creditCost);

    const startDateKey = resolveStartDateKey(dto.startDate, timezone);
    const slotDates = buildCalendarSlotDates(
      slotCount,
      startDateKey,
      postingDays,
      timezone,
    );

    const input: CalendarInput = {
      workspaceId,
      userId,
      durationDays: dto.durationDays,
      contentProfileId: dto.contentProfileId,
      startDate: startDateKey,
      postingTime,
      postingDays,
      additionalContext: dto.additionalContext,
      slotDates,
      slotGenerationMode,
      mediaFormat: dto.mediaFormat,
      carouselSlideCount: dto.carouselSlideCount,
      mediaMode: dto.mediaMode,
      mediaTemplateId: dto.mediaTemplateId,
    };

    const job = await this.enqueueService.enqueue({
      workspaceId,
      userId,
      type: GenerationJobType.calendar,
      flowId: 'calendar-planner',
      promptVersion: 'v1',
      creditCost,
      input: input as unknown as Prisma.InputJsonValue,
    });

    const fullJob = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: job.id },
    });

    return toGenerationJobResponse(fullJob);
  }
}
