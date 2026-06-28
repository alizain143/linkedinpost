import { Injectable, Logger } from '@nestjs/common';
import {
  PostPackageStatus,
  PostSource,
  PostType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CalendarInput,
  CalendarJobResult,
  GenerationJobProgress,
} from '../generation/generation.types';
import { CalendarPlannerService } from './calendar-planner.service';
import { CalendarSlotService } from './calendar-slot.service';
import { localDateTimeToUtc } from './calendar-schedule.util';
import { CalendarPlannerOutput } from './parsers/calendar-planner-output.parser';

type CalendarJobResultPayload = CalendarJobResult & {
  postPackageIds?: string[];
};

@Injectable()
export class CalendarOrchestrator {
  private readonly logger = new Logger(CalendarOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarPlannerService: CalendarPlannerService,
    private readonly calendarSlotService: CalendarSlotService,
  ) {}

  async run(generationJobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
      include: { user: true },
    });

    const input = job.input as unknown as CalendarInput;
    const timezone = job.user.timezone || 'America/New_York';
    const slotCount = input.slotDates.length;
    const totalSteps = 1 + slotCount;

    const existingResult = job.result as CalendarJobResultPayload | null;
    const createdPostIds = [...(existingResult?.postPackageIds ?? [])];
    const resultSlots: CalendarJobResult['slots'] = [
      ...(existingResult?.slots ?? []),
    ];

    try {
      let plan: CalendarPlannerOutput | null = existingResult?.slots?.length
        ? {
            slots: input.slotDates.map((date, index) => ({
              date,
              topic: existingResult.slots[index]?.topic ?? `Topic ${index + 1}`,
              pillar: existingResult.slots[index]?.pillar ?? '',
              postType: PostType.personal_story,
              tone: '',
            })),
          }
        : null;

      if (!plan) {
        await this.updateProgress(generationJobId, {
          currentStep: 'planner',
          currentLabel: 'Planning calendar topics',
          completedSteps: 0,
          totalSteps,
          percentComplete: 0,
        });

        plan = await this.calendarPlannerService.plan(input);

        await this.updateProgress(generationJobId, {
          currentStep: 'planner',
          currentLabel: 'Calendar plan ready',
          completedSteps: 1,
          totalSteps,
          percentComplete: Math.round((1 / totalSteps) * 100),
        });
      }

      if (!plan) {
        throw new Error(`Calendar job ${generationJobId} missing plan`);
      }

      const startIndex = createdPostIds.length;

      for (let index = startIndex; index < plan.slots.length; index++) {
        const slot = plan.slots[index];
        const step = index + 2;

        await this.updateProgress(generationJobId, {
          currentStep: `slot_${index + 1}`,
          currentLabel: `Generating post ${index + 1} of ${slotCount}`,
          completedSteps: step - 1,
          totalSteps,
          percentComplete: Math.round(((step - 1) / totalSteps) * 100),
        });

        const variant = await this.calendarSlotService.generateVariant(
          {
            workspaceId: input.workspaceId,
            userId: input.userId,
            contentProfileId: input.contentProfileId,
            additionalContext: input.additionalContext,
          },
          slot,
        );

        const scheduledAt = localDateTimeToUtc(
          slot.date,
          input.postingTime,
          timezone,
        );

        const post = await this.prisma.postPackage.create({
          data: {
            workspaceId: input.workspaceId,
            contentProfileId: input.contentProfileId ?? null,
            hook: variant.hook,
            body: variant.body,
            cta: variant.cta,
            tags: variant.tags,
            topic: slot.topic,
            postType: slot.postType,
            tone: slot.tone || variant.tone,
            pillar: slot.pillar || variant.pillar,
            source: PostSource.calendar,
            status: PostPackageStatus.ready_for_approval,
            scheduledAt,
            submittedForApprovalAt: new Date(),
            versions: {
              create: {
                versionNumber: 1,
                hook: variant.hook,
                body: variant.body,
                cta: variant.cta,
                tags: variant.tags,
              },
            },
          },
        });

        createdPostIds.push(post.id);
        resultSlots.push({
          postPackageId: post.id,
          scheduledAt: scheduledAt.toISOString(),
          topic: slot.topic,
          pillar: slot.pillar || variant.pillar || null,
        });

        await this.prisma.generationJob.update({
          where: { id: generationJobId },
          data: {
            result: {
              durationDays: input.durationDays,
              slotCount,
              postPackageIds: createdPostIds,
              slots: resultSlots,
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          result: {
            durationDays: input.durationDays,
            slotCount,
            postPackageIds: createdPostIds,
            slots: resultSlots,
          } as unknown as Prisma.InputJsonValue,
          progress: {
            currentStep: 'completed',
            currentLabel: 'Calendar generation complete',
            completedSteps: totalSteps,
            totalSteps,
            percentComplete: 100,
          },
        },
      });
    } catch (err) {
      this.logger.error(`Calendar job ${generationJobId} failed`, err);

      if (createdPostIds.length > 0) {
        await this.prisma.postPackage.updateMany({
          where: { id: { in: createdPostIds } },
          data: { deletedAt: new Date() },
        });
      }

      throw err;
    }
  }

  private async updateProgress(
    generationJobId: string,
    progress: GenerationJobProgress,
  ): Promise<void> {
    await this.prisma.generationJob.update({
      where: { id: generationJobId },
      data: {
        currentStep: progress.currentStep,
        progress: progress as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
