import { Test, TestingModule } from '@nestjs/testing';
import { PostSource } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { buildUser, userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { CouncilJobService } from '../council/council-job.service';
import { CreditsService } from '../credits/credits.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { AutopilotDispatchService } from './autopilot-dispatch.service';

describe('AutopilotDispatchService', () => {
  let service: AutopilotDispatchService;
  const prisma = createMockPrismaService();
  const creditsService = {
    getBalance: jest.fn(),
  };
  const councilJobService = {
    enqueueCouncil: jest.fn(),
  };
  const enqueueService = {
    assertRedisAvailable: jest.fn(),
  };
  const planFeatureService = {
    hasFeature: jest.fn().mockResolvedValue(true),
  };

  const config = {
    id: 'autopilot-1',
    workspaceId,
    contentProfileId: null,
    dayProfileOverrides: null,
    approvalMode: 'require_approval' as const,
    enabled: true,
    postingDays: [5],
    postingTime: '09:00',
    lastPillarIndex: 0,
    lastRunDateKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    creditsService.getBalance.mockResolvedValue({
      remaining: 20,
      used: 0,
      limit: 200,
    });
    prisma.contentProfile.findFirst.mockResolvedValue({
      id: 'profile-1',
      workspaceId,
      pillars: [{ id: 'p1', name: 'Founder lessons', sortOrder: 0 }],
    });
    councilJobService.enqueueCouncil.mockResolvedValue({ id: 'job-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutopilotDispatchService,
        { provide: PrismaService, useValue: prisma },
        { provide: CreditsService, useValue: creditsService },
        { provide: CouncilJobService, useValue: councilJobService },
        { provide: GenerationJobEnqueueService, useValue: enqueueService },
        { provide: PlanFeatureService, useValue: planFeatureService },
      ],
    }).compile();

    service = module.get(AutopilotDispatchService);
  });

  it('skips dispatch when credits are insufficient', async () => {
    creditsService.getBalance.mockResolvedValue({
      remaining: 5,
      used: 195,
      limit: 200,
    });

    const result = await service.dispatch(
      config,
      userId,
      buildUser().timezone!,
      new Date('2026-06-26T13:00:00.000Z'),
    );

    expect(result.success).toBe(false);
    expect(councilJobService.enqueueCouncil).not.toHaveBeenCalled();
  });

  it('uses day profile override for the current weekday', async () => {
    const now = new Date('2026-06-26T13:00:00.000Z');
    prisma.contentProfile.findFirst.mockImplementation(async ({ where }) => {
      if (where.id === 'profile-override') {
        return {
          id: 'profile-override',
          workspaceId,
          pillars: [{ id: 'p2', name: 'Leadership', sortOrder: 0 }],
        };
      }
      return {
        id: 'profile-1',
        workspaceId,
        pillars: [{ id: 'p1', name: 'Founder lessons', sortOrder: 0 }],
      };
    });

    await service.dispatch(
      {
        ...config,
        contentProfileId: 'profile-1',
        dayProfileOverrides: { '5': 'profile-override' },
      },
      userId,
      'America/New_York',
      now,
    );

    expect(councilJobService.enqueueCouncil).toHaveBeenCalledWith(
      workspaceId,
      userId,
      expect.objectContaining({
        topic: 'Insights on Leadership',
        contentProfileId: 'profile-override',
      }),
      expect.any(Object),
    );
  });

  it('enqueues council with autopilot source and 10 credits', async () => {
    const now = new Date('2026-06-26T13:00:00.000Z');

    const result = await service.dispatch(
      config,
      userId,
      'America/New_York',
      now,
    );

    expect(result.success).toBe(true);
    expect(councilJobService.enqueueCouncil).toHaveBeenCalledWith(
      workspaceId,
      userId,
      expect.objectContaining({
        topic: 'Insights on Founder lessons',
        pillar: 'Founder lessons',
      }),
      expect.objectContaining({
        source: PostSource.autopilot,
        creditCost: 10,
        scheduledAt: expect.any(Date),
      }),
    );
  });
});
