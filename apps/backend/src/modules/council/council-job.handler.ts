import { Injectable, Logger } from '@nestjs/common';
import {
  AutopilotApprovalMode,
  CreditTransactionType,
  GenerationJobStatus,
  GenerationJobType,
  PostSource,
} from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { CreditsService } from '../credits/credits.service';
import { JobHandler } from '../job-queue/job-handler.interface';
import { NotificationEventService } from '../notifications/notification-event.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CouncilOrchestrator } from './council-orchestrator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouncilJobHandler implements JobHandler {
  private readonly logger = new Logger(CouncilJobHandler.name);
  readonly type = GenerationJobType.council;

  constructor(
    private readonly prisma: PrismaService,
    private readonly councilOrchestrator: CouncilOrchestrator,
    private readonly creditsService: CreditsService,
    private readonly notificationEvents: NotificationEventService,
    private readonly schedulingService: SchedulingService,
  ) {}

  async handle(generationJobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
    });

    if (job.creditCharged) {
      return;
    }

    if (job.status !== GenerationJobStatus.completed) {
      await this.councilOrchestrator.run(generationJobId);
    }

    const refreshedJob = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
    });

    if (refreshedJob.status === GenerationJobStatus.failed) {
      return;
    }

    const post = job.postPackageId
      ? await this.prisma.postPackage.findUnique({
          where: { id: job.postPackageId },
        })
      : null;

    const creditType =
      post?.source === PostSource.autopilot
        ? CreditTransactionType.autopilot
        : CreditTransactionType.council;

    await this.creditsService.consume(job.userId, job.creditCost, creditType, {
      generationJobId,
    });

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

    const completedPost = completedJob.postPackageId
      ? await this.prisma.postPackage.findUnique({
          where: { id: completedJob.postPackageId },
        })
      : null;

    if (completedPost?.source === PostSource.autopilot && completedPost.id) {
      await this.maybeAutoScheduleAutopilotPost(
        completedJob.workspaceId,
        completedPost.id,
        completedPost.scheduledAt,
      );
    }

    await this.notificationEvents.emitGenerationComplete({
      userId: completedJob.userId,
      workspaceId: completedJob.workspaceId,
      generationJobId: completedJob.id,
      postPackageId: completedPost?.id,
      postHook: completedPost?.hook,
    });
  }

  private async maybeAutoScheduleAutopilotPost(
    workspaceId: string,
    postId: string,
    scheduledAt: Date | null,
  ): Promise<void> {
    const config = await this.prisma.autopilotConfig.findFirst({
      where: { workspaceId, ...NOT_DELETED },
    });

    if (
      !config ||
      config.approvalMode !== AutopilotApprovalMode.auto_schedule
    ) {
      return;
    }

    const scheduled = await this.schedulingService.scheduleAutopilotPost(
      workspaceId,
      postId,
      scheduledAt,
    );

    if (!scheduled) {
      this.logger.warn(
        `Autopilot auto-schedule skipped for post ${postId} in workspace ${workspaceId}`,
      );
    }
  }
}
