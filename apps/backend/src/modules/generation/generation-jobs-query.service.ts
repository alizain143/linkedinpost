import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toGenerationJobResponse } from './generation-job.mapper';

@Injectable()
export class GenerationJobsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getJobForUser(jobId: string, userId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: { id: jobId, userId },
      include: {
        councilRun: {
          include: {
            events: { orderBy: { stepOrder: 'asc' } },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException({
        error: 'Generation job not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return toGenerationJobResponse(job);
  }
}
