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
import { mockNotificationEventServiceProvider } from '../../test/notification-event.mock';
import { NotificationEventService } from '../notifications/notification-event.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CouncilOrchestrator } from './council-orchestrator';
import { CouncilJobHandler } from './council-job.handler';

describe('CouncilJobHandler', () => {
  let handler: CouncilJobHandler;
  const prisma = createMockPrismaService();
  const councilOrchestrator = { run: jest.fn() };
  const creditsService = { consume: jest.fn() };
  const schedulingService = { scheduleAutopilotPost: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouncilJobHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: CouncilOrchestrator, useValue: councilOrchestrator },
        { provide: CreditsService, useValue: creditsService },
        { provide: SchedulingService, useValue: schedulingService },
        mockNotificationEventServiceProvider(),
      ],
    }).compile();

    handler = module.get(CouncilJobHandler);
  });

  it('charges autopilot credits for autopilot posts', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      userId,
      creditCost: 10,
      creditCharged: false,
      postPackageId: 'post-1',
      type: GenerationJobType.council,
      status: 'pending',
      input: {},
      result: null,
    });
    prisma.postPackage.findUnique.mockResolvedValue({
      id: 'post-1',
      source: PostSource.autopilot,
    });
    prisma.generationJob.update.mockResolvedValue({});

    await handler.handle('job-1');

    expect(councilOrchestrator.run).toHaveBeenCalledWith('job-1');
    expect(creditsService.consume).toHaveBeenCalledWith(
      userId,
      10,
      CreditTransactionType.autopilot,
      { generationJobId: 'job-1' },
    );
  });

  it('charges council credits for manual council posts', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-2',
      userId,
      creditCost: 3,
      creditCharged: false,
      postPackageId: 'post-2',
      type: GenerationJobType.council,
      status: 'pending',
      input: {},
      result: null,
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
      { generationJobId: 'job-2' },
    );
  });

  it('skips work when credits already charged', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-3',
      userId,
      creditCost: 3,
      creditCharged: true,
      type: GenerationJobType.council,
      status: 'completed',
      input: {},
      result: null,
    });

    await handler.handle('job-3');

    expect(councilOrchestrator.run).not.toHaveBeenCalled();
    expect(creditsService.consume).not.toHaveBeenCalled();
  });
});
