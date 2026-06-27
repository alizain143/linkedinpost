import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GenerationJobType } from '@prisma/client';
import { userId, workspaceId } from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { CreditsService } from '../credits/credits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { CalendarJobService } from './calendar-job.service';

describe('CalendarJobService', () => {
  let service: CalendarJobService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };
  const creditsService = { assertHasCredits: jest.fn() };
  const enqueueService = {
    assertRedisAvailable: jest.fn(),
    enqueue: jest.fn(),
  };
  const planFeatureService = { assertAllows: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      timezone: 'America/New_York',
    });
    enqueueService.enqueue.mockResolvedValue({
      id: 'job-1',
      type: GenerationJobType.calendar,
      creditCost: 10,
    });
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      type: GenerationJobType.calendar,
      creditCost: 10,
      status: 'pending',
      workspaceId,
      flowId: 'calendar-planner',
      promptVersion: 'v1',
      creditCharged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      model: null,
      errorCode: null,
      errorMessage: null,
      postPackageId: null,
      progress: null,
      result: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarJobService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: CreditsService, useValue: creditsService },
        { provide: GenerationJobEnqueueService, useValue: enqueueService },
        { provide: PlanFeatureService, useValue: planFeatureService },
      ],
    }).compile();

    service = module.get(CalendarJobService);
  });

  it('enqueues a 7-day calendar job with 10 credits', async () => {
    await service.enqueueCalendar(workspaceId, userId, { durationDays: 7 });

    expect(creditsService.assertHasCredits).toHaveBeenCalledWith(userId, 10);
    expect(enqueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        type: GenerationJobType.calendar,
        creditCost: 10,
        flowId: 'calendar-planner',
      }),
    );
  });

  it('enqueues a 30-day calendar job with 30 credits', async () => {
    await service.enqueueCalendar(workspaceId, userId, { durationDays: 30 });

    expect(planFeatureService.assertAllows).toHaveBeenCalledWith(
      userId,
      'calendar_30_day',
    );
    expect(creditsService.assertHasCredits).toHaveBeenCalledWith(userId, 30);
    expect(enqueueService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        creditCost: 30,
      }),
    );
  });

  it('rejects 30-day calendar for plans without the feature', async () => {
    planFeatureService.assertAllows.mockRejectedValue(new ForbiddenException());

    await expect(
      service.enqueueCalendar(workspaceId, userId, { durationDays: 30 }),
    ).rejects.toThrow(ForbiddenException);
  });
});
