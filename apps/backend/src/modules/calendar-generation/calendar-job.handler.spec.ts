import { Test, TestingModule } from '@nestjs/testing';
import {
  CreditTransactionType,
  GenerationJobStatus,
  GenerationJobType,
} from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { CalendarOrchestrator } from './calendar-orchestrator';
import { CalendarJobHandler } from './calendar-job.handler';

describe('CalendarJobHandler', () => {
  let handler: CalendarJobHandler;
  const prisma = createMockPrismaService();
  const calendarOrchestrator = { run: jest.fn() };
  const creditsService = { consume: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarJobHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: CalendarOrchestrator, useValue: calendarOrchestrator },
        { provide: CreditsService, useValue: creditsService },
      ],
    }).compile();

    handler = module.get(CalendarJobHandler);
  });

  it('skips orchestrator when posts already exist in job result', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      userId,
      creditCost: 10,
      status: GenerationJobStatus.running,
      creditCharged: false,
      result: { postPackageIds: ['post-1'] },
      type: GenerationJobType.calendar,
    });
    prisma.generationJob.update.mockResolvedValue({});

    await handler.handle('job-1');

    expect(calendarOrchestrator.run).not.toHaveBeenCalled();
    expect(creditsService.consume).toHaveBeenCalledWith(
      userId,
      10,
      CreditTransactionType.calendar,
      { generationJobId: 'job-1' },
    );
  });

  it('returns early when credits already charged', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      userId,
      creditCost: 10,
      creditCharged: true,
      type: GenerationJobType.calendar,
    });

    await handler.handle('job-1');

    expect(calendarOrchestrator.run).not.toHaveBeenCalled();
    expect(creditsService.consume).not.toHaveBeenCalled();
  });
});
