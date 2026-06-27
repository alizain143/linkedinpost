import { Test, TestingModule } from '@nestjs/testing';
import {
  CreditTransactionType,
  GenerationJobType,
  PostSource,
} from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { CouncilOrchestrator } from './council-orchestrator';
import { CouncilJobHandler } from './council-job.handler';

describe('CouncilJobHandler', () => {
  let handler: CouncilJobHandler;
  const prisma = createMockPrismaService();
  const councilOrchestrator = { run: jest.fn() };
  const creditsService = { consume: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouncilJobHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: CouncilOrchestrator, useValue: councilOrchestrator },
        { provide: CreditsService, useValue: creditsService },
      ],
    }).compile();

    handler = module.get(CouncilJobHandler);
  });

  it('charges autopilot credits for autopilot posts', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      userId,
      creditCost: 10,
      postPackageId: 'post-1',
      type: GenerationJobType.council,
      councilRun: { id: 'run-1' },
    });
    prisma.postPackage.findUnique.mockResolvedValue({
      id: 'post-1',
      source: PostSource.autopilot,
    });
    prisma.generationJob.update.mockResolvedValue({});

    await handler.handle('job-1');

    expect(councilOrchestrator.run).toHaveBeenCalledWith('run-1');
    expect(creditsService.consume).toHaveBeenCalledWith(
      userId,
      10,
      CreditTransactionType.autopilot,
      'job-1',
    );
  });

  it('charges council credits for manual council posts', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-2',
      userId,
      creditCost: 3,
      postPackageId: 'post-2',
      type: GenerationJobType.council,
      councilRun: { id: 'run-2' },
    });
    prisma.postPackage.findUnique.mockResolvedValue({
      id: 'post-2',
      source: PostSource.generation,
    });
    prisma.generationJob.update.mockResolvedValue({});

    await handler.handle('job-2');

    expect(creditsService.consume).toHaveBeenCalledWith(
      userId,
      3,
      CreditTransactionType.council,
      'job-2',
    );
  });
});
