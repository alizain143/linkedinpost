import {
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { GenerationJobStatus, GenerationJobType, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GENERATION_JOBS_QUEUE,
  REDIS_ENABLED,
} from './job-queue.constants';

export interface EnqueueGenerationJobInput {
  workspaceId: string;
  userId: string;
  type: GenerationJobType;
  flowId: string;
  promptVersion?: string;
  creditCost: number;
  input: Prisma.InputJsonValue;
  postPackageId?: string;
}

@Injectable()
export class GenerationJobEnqueueService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_ENABLED) private readonly redisEnabled: boolean,
    @Optional()
    @InjectQueue(GENERATION_JOBS_QUEUE)
    private readonly queue?: Queue,
  ) {}

  isEnabled(): boolean {
    return this.redisEnabled && Boolean(this.queue);
  }

  assertRedisAvailable(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException({
        error: 'Redis is required for async generation jobs',
        code: 'REDIS_UNAVAILABLE',
      });
    }
  }

  async enqueue(input: EnqueueGenerationJobInput) {
    this.assertRedisAvailable();

    const job = await this.prisma.generationJob.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        type: input.type,
        status: GenerationJobStatus.pending,
        flowId: input.flowId,
        promptVersion: input.promptVersion ?? 'v1',
        creditCost: input.creditCost,
        input: input.input,
        postPackageId: input.postPackageId,
      },
    });

    await this.queue!.add(
      'process',
      { generationJobId: job.id },
      { jobId: job.id },
    );

    return job;
  }
}
