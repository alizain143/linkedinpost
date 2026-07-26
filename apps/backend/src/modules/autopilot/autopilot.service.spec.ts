import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreditsService } from '../credits/credits.service';
import { LinkedInConnectionService } from '../linkedin/linkedin.services';
import { AutopilotService } from './autopilot.service';

describe('AutopilotService', () => {
  let service: AutopilotService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };
  const creditsService = { assertHasCredits: jest.fn() };
  const linkedInConnectionService = {
    getConnection: jest.fn().mockResolvedValue({
      connected: true,
      publishReady: true,
    }),
  };

  const config = {
    id: 'autopilot-1',
    workspaceId,
    contentProfileId: null,
    dayProfileOverrides: null,
    approvalMode: 'require_approval' as const,
    enabled: false,
    postingDays: [1, 3, 4, 5, 7],
    postingTime: '09:00',
    lastPillarIndex: 0,
    lastRunDateKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    creditsService.assertHasCredits.mockResolvedValue(undefined);

    prisma.workspace.findUniqueOrThrow.mockResolvedValue({
      id: workspaceId,
      ownerId: userId,
      owner: { id: userId, timezone: 'America/New_York' },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutopilotService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
        { provide: CreditsService, useValue: creditsService },
        {
          provide: LinkedInConnectionService,
          useValue: linkedInConnectionService,
        },
      ],
    }).compile();

    service = module.get(AutopilotService);
  });

  it('returns default config on GET when none exists', async () => {
    prisma.autopilotConfig.findFirst.mockResolvedValue(null);
    prisma.autopilotConfig.create.mockResolvedValue(config);

    const result = await service.getConfig(workspaceId, userId);

    expect(workspacesService.assertMember).toHaveBeenCalledWith(
      userId,
      workspaceId,
    );
    expect(result.enabled).toBe(false);
    expect(result.postingPreset).toBe('three_per_week');
    expect(result.status).toBe('inactive');
  });

  it('upserts config and checks credits when enabling', async () => {
    prisma.autopilotConfig.findFirst.mockResolvedValue(null);
    prisma.contentProfile.findFirst.mockResolvedValue({
      id: 'profile-1',
      pillars: [{ id: 'p1', name: 'Lessons', sortOrder: 0 }],
    });
    prisma.autopilotConfig.upsert.mockResolvedValue({
      ...config,
      enabled: true,
      postingDays: [1, 2, 3, 4, 5],
    });

    const result = await service.upsertConfig(workspaceId, userId, {
      enabled: true,
      postingPreset: 'weekdays',
    });

    expect(creditsService.assertHasCredits).toHaveBeenCalledWith(userId, 3);
    expect(prisma.autopilotConfig.upsert).toHaveBeenCalled();
    expect(result.enabled).toBe(true);
    expect(result.postingDays).toEqual([1, 2, 3, 4, 5]);
    expect(result.postingPreset).toBe('weekdays');
    expect(result.status).toBe('active');
  });

  it('rejects enable when credits are insufficient', async () => {
    prisma.autopilotConfig.findFirst.mockResolvedValue(config);
    creditsService.assertHasCredits.mockRejectedValue(
      new HttpException(
        { code: 'CREDITS_EXHAUSTED', error: 'Insufficient credits' },
        HttpStatus.PAYMENT_REQUIRED,
      ),
    );

    await expect(
      service.upsertConfig(workspaceId, userId, { enabled: true }),
    ).rejects.toMatchObject({
      response: { code: 'CREDITS_EXHAUSTED' },
    });
    expect(prisma.autopilotConfig.upsert).not.toHaveBeenCalled();
  });

  it('rejects enable when content profile has no pillars', async () => {
    prisma.autopilotConfig.findFirst.mockResolvedValue(config);
    prisma.contentProfile.findFirst.mockResolvedValue({
      id: 'profile-1',
      pillars: [],
    });

    await expect(
      service.upsertConfig(workspaceId, userId, { enabled: true }),
    ).rejects.toMatchObject({
      response: { code: 'AUTOPILOT_NO_PILLARS' },
    });
    expect(prisma.autopilotConfig.upsert).not.toHaveBeenCalled();
  });
});
