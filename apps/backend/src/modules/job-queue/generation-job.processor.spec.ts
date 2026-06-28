import { GenerationJobStatus, GenerationJobType } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { GenerationJobProcessor } from './generation-job.processor';
import { JobHandlerRegistry } from './job-handler.registry';

describe('GenerationJobProcessor', () => {
  const prisma = createMockPrismaService();
  const handlerRegistry = {
    get: jest.fn(),
  };
  const handler = { handle: jest.fn() };

  let processor: GenerationJobProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new GenerationJobProcessor(
      prisma as never,
      handlerRegistry as unknown as JobHandlerRegistry,
    );
  });

  it('skips jobs that already charged credits', async () => {
    prisma.generationJob.findUnique.mockResolvedValue({
      id: 'job-1',
      type: GenerationJobType.council,
      status: GenerationJobStatus.failed,
      creditCharged: true,
    });

    await processor.process({ data: { generationJobId: 'job-1' } } as never);

    expect(handlerRegistry.get).not.toHaveBeenCalled();
  });

  it('claims and runs handler for pending jobs', async () => {
    prisma.generationJob.findUnique.mockResolvedValue({
      id: 'job-1',
      type: GenerationJobType.council,
      status: GenerationJobStatus.pending,
      creditCharged: false,
    });
    prisma.generationJob.updateMany.mockResolvedValue({ count: 1 });
    handlerRegistry.get.mockReturnValue(handler);
    handler.handle.mockResolvedValue(undefined);

    await processor.process({ data: { generationJobId: 'job-1' } } as never);

    expect(handler.handle).toHaveBeenCalledWith('job-1');
  });
});
