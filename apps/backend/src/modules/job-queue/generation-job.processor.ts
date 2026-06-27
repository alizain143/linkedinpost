import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { GenerationJobStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { extractGenerationError } from '../generation/generation.errors';
import { GENERATION_JOBS_QUEUE } from './job-queue.constants';
import { JobHandlerRegistry } from './job-handler.registry';

export interface GenerationJobPayload {
  generationJobId: string;
}

@Processor(GENERATION_JOBS_QUEUE)
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

    if (generationJob.status === GenerationJobStatus.completed) {
      return;
    }

    await this.prisma.generationJob.update({
      where: { id: generationJobId },
      data: { status: GenerationJobStatus.running },
    });

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
      return;
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

      throw err;
    }
  }
}
