import { Injectable } from '@nestjs/common';
import {
  CreditTransactionType,
  GenerationJobStatus,
  GenerationJobType,
} from '@prisma/client';
import { CreditsService } from '../credits/credits.service';
import { JobHandler } from '../job-queue/job-handler.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CalendarOrchestrator } from './calendar-orchestrator';

type CalendarJobResult = {
  postPackageIds?: string[];
};

@Injectable()
export class CalendarJobHandler implements JobHandler {
  readonly type = GenerationJobType.calendar;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarOrchestrator: CalendarOrchestrator,
    private readonly creditsService: CreditsService,
    private readonly notificationEvents: NotificationEventService,
  ) {}

  async handle(generationJobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
    });

    if (job.creditCharged) {
      return;
    }

    const existingResult = job.result as CalendarJobResult | null;
    const hasCreatedPosts =
      (existingResult?.postPackageIds?.length ?? 0) > 0 ||
      job.status === GenerationJobStatus.completed;

    if (!hasCreatedPosts) {
      await this.calendarOrchestrator.run(generationJobId);
    }

    await this.creditsService.consume(
      job.userId,
      job.creditCost,
      CreditTransactionType.calendar,
      { generationJobId },
    );

    await this.prisma.generationJob.update({
      where: { id: generationJobId },
      data: {
        creditCharged: true,
        status: GenerationJobStatus.completed,
        completedAt: new Date(),
      },
    });

    const completedJob = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
    });

    await this.notificationEvents.emitGenerationComplete({
      userId: completedJob.userId,
      workspaceId: completedJob.workspaceId,
      generationJobId: completedJob.id,
    });
  }
}
