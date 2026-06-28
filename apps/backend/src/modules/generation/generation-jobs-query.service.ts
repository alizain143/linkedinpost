import { Injectable, NotFoundException } from '@nestjs/common';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { toGenerationJobResponse } from './generation-job.mapper';

@Injectable()
export class GenerationJobsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getJobForUser(jobId: string, userId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: { id: jobId, userId, ...NOT_DELETED },
      include: {
        councilEvents: { orderBy: { stepOrder: 'asc' } },
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
