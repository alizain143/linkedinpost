import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { GenerationJobStatus, PostSource } from '@prisma/client';
import { Job } from 'bullmq';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { extractGenerationError } from '../generation/generation.errors';
import { GENERATION_JOBS_QUEUE } from './job-queue.constants';
import { JobHandlerRegistry } from './job-handler.registry';

export interface GenerationJobPayload {
  generationJobId: string;
}

const queueConcurrency = parseInt(
  process.env.GENERATION_QUEUE_CONCURRENCY ?? '2',
  10,
);

@Processor(GENERATION_JOBS_QUEUE, { concurrency: queueConcurrency })
export class GenerationJobProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationJobProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly handlerRegistry: JobHandlerRegistry,
  ) {
    super();
  }

  async process(job: Job<GenerationJobPayload>): Promise<void> {
    const { generationJobId } = job.data;

    const generationJob = await this.prisma.generationJob.findUnique({
      where: { id: generationJobId },
    });

    if (!generationJob) {
      this.logger.warn(`Generation job ${generationJobId} not found`);
      return;
    }

    if (
      generationJob.creditCharged ||
      generationJob.status === GenerationJobStatus.completed
    ) {
      return;
    }

    const claim = await this.prisma.generationJob.updateMany({
      where: {
        id: generationJobId,
        creditCharged: false,
        status: {
          in: [GenerationJobStatus.pending, GenerationJobStatus.failed],
        },
      },
      data: { status: GenerationJobStatus.running },
    });

    if (claim.count === 0) {
      return;
    }

    const handler = this.handlerRegistry.get(generationJob.type);

    if (!handler) {
      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          status: GenerationJobStatus.failed,
          errorCode: 'JOB_HANDLER_NOT_FOUND',
          errorMessage: `No handler for job type ${generationJob.type}`,
          completedAt: new Date(),
        },
      });
      throw new Error(`No handler for job type ${generationJob.type}`);
    }

    try {
      await handler.handle(generationJobId);
    } catch (err) {
      const { code, message } = extractGenerationError(err);

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          status: GenerationJobStatus.failed,
          errorCode: code,
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      await this.resetAutopilotRunIfFailed(generationJobId);

      throw err;
    }
  }

  private async resetAutopilotRunIfFailed(
    generationJobId: string,
  ): Promise<void> {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: generationJobId },
      include: {
        postPackage: true,
      },
    });

    if (job?.postPackage?.source !== PostSource.autopilot) {
      return;
    }

    await this.prisma.autopilotConfig.updateMany({
      where: {
        workspaceId: job.workspaceId,
        ...NOT_DELETED,
      },
      data: { lastRunDateKey: null },
    });
  }
}
