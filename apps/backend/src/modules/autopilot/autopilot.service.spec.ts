import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AutopilotFrequency } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { PlanFeatureService } from '../billing/plan-feature.service';
import { AutopilotService } from './autopilot.service';

describe('AutopilotService', () => {
  let service: AutopilotService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };
  const planFeatureService = { assertAllows: jest.fn() };

  const config = {
    id: 'autopilot-1',
    workspaceId,
    contentProfileId: null,
    enabled: false,
    frequency: AutopilotFrequency.three_per_week,
    postingDays: [1, 3, 4, 5, 7],
    postingTime: '09:00',
    lastPillarIndex: 0,
    lastRunDateKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
        { provide: PlanFeatureService, useValue: planFeatureService },
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
    expect(result.frequency).toBe(AutopilotFrequency.three_per_week);
    expect(result.status).toBe('inactive');
  });

  it('upserts config and applies frequency preset', async () => {
    prisma.autopilotConfig.findFirst.mockResolvedValue(null);
    prisma.autopilotConfig.upsert.mockResolvedValue({
      ...config,
      enabled: true,
      frequency: AutopilotFrequency.weekdays,
      postingDays: [1, 2, 3, 4, 5],
    });

    const result = await service.upsertConfig(workspaceId, userId, {
      enabled: true,
      frequency: AutopilotFrequency.weekdays,
    });

    expect(prisma.autopilotConfig.upsert).toHaveBeenCalled();
    expect(result.enabled).toBe(true);
    expect(result.postingDays).toEqual([1, 2, 3, 4, 5]);
    expect(result.status).toBe('active');
    expect(planFeatureService.assertAllows).toHaveBeenCalledWith(
      userId,
      'autopilot',
    );
  });

  it('checks plan feature when enabling autopilot', async () => {
    prisma.autopilotConfig.findFirst.mockResolvedValue(config);
    prisma.autopilotConfig.upsert.mockResolvedValue({
      ...config,
      enabled: true,
    });
    planFeatureService.assertAllows.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      service.upsertConfig(workspaceId, userId, { enabled: true }),
    ).rejects.toThrow();
    expect(planFeatureService.assertAllows).toHaveBeenCalledWith(
      userId,
      'autopilot',
    );
  });
});
