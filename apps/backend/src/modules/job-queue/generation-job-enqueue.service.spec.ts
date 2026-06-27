import { ServiceUnavailableException } from '@nestjs/common';
import { GenerationJobType } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId, workspaceId } from '../../test/fixtures';
import { GenerationJobEnqueueService } from './generation-job-enqueue.service';

describe('GenerationJobEnqueueService', () => {
  const prisma = createMockPrismaService();
  const queue = { add: jest.fn() };

  it('throws when redis is disabled', async () => {
    const service = new GenerationJobEnqueueService(prisma, false, undefined);

    expect(() => service.assertRedisAvailable()).toThrow(
      ServiceUnavailableException,
    );
  });

  it('creates job and enqueues when redis enabled', async () => {
    const service = new GenerationJobEnqueueService(
      prisma,
      true,
      queue as never,
    );

    prisma.generationJob.create.mockResolvedValue({
      id: 'job-1',
      workspaceId,
      userId,
    });

    const job = await service.enqueue({
      workspaceId,
      userId,
      type: GenerationJobType.council,
      flowId: 'council',
      creditCost: 3,
      input: { topic: 'Test' },
    });

    expect(job.id).toBe('job-1');
    expect(queue.add).toHaveBeenCalledWith(
      'process',
      { generationJobId: 'job-1' },
      { jobId: 'job-1' },
    );
  });
});
