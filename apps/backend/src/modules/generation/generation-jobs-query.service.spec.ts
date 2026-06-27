import { NotFoundException } from '@nestjs/common';
import { GenerationJobType } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { GenerationJobsQueryService } from './generation-jobs-query.service';

describe('GenerationJobsQueryService', () => {
  let service: GenerationJobsQueryService;
  const prisma = createMockPrismaService();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GenerationJobsQueryService(prisma as never);
  });

  it('returns job with council events', async () => {
    prisma.generationJob.findFirst.mockResolvedValue({
      id: 'job-1',
      workspaceId: 'ws-1',
      userId,
      type: GenerationJobType.council,
      status: 'running',
      flowId: 'council',
      promptVersion: 'v1',
      model: null,
      creditCost: 3,
      creditCharged: false,
      errorCode: null,
      errorMessage: null,
      postPackageId: 'post-1',
      progress: null,
      result: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      councilRun: {
        id: 'run-1',
        events: [],
      },
    });

    const result = await service.getJobForUser('job-1', userId);
    expect(result.councilRunId).toBe('run-1');
    expect(result.events).toEqual([]);
  });

  it('throws when job not found', async () => {
    prisma.generationJob.findFirst.mockResolvedValue(null);

    await expect(service.getJobForUser('missing', userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
