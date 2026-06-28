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
import { MediaOnlyOrchestrator } from './media-only-orchestrator';

@Injectable()
export class MediaJobHandler implements JobHandler {
  readonly type = GenerationJobType.media;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaOnlyOrchestrator: MediaOnlyOrchestrator,
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

    if (job.status !== GenerationJobStatus.completed) {
      await this.mediaOnlyOrchestrator.run(generationJobId);
    }

    await this.creditsService.consume(
      job.userId,
      job.creditCost,
      CreditTransactionType.media,
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

    const post = completedJob.postPackageId
      ? await this.prisma.postPackage.findUnique({
          where: { id: completedJob.postPackageId },
        })
      : null;

    await this.notificationEvents.emitGenerationComplete({
      userId: completedJob.userId,
      workspaceId: completedJob.workspaceId,
      generationJobId: completedJob.id,
      postPackageId: post?.id,
      postHook: post?.hook,
    });
  }
}
