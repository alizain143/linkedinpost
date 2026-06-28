import { Test, TestingModule } from '@nestjs/testing';
import { createMockPrismaService } from '../../test/prisma.mock';
import { buildUser, userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { AutopilotDispatchService } from './autopilot-dispatch.service';
import { AutopilotTickService } from './autopilot-tick.service';

describe('AutopilotTickService', () => {
  let service: AutopilotTickService;
  const prisma = createMockPrismaService();
  const dispatchService = {
    dispatch: jest.fn(),
  };

  const config = {
    id: 'autopilot-1',
    workspaceId,
    contentProfileId: null,
    enabled: true,
    postingDays: [5],
    postingTime: '09:00',
    lastPillarIndex: 0,
    lastRunDateKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: {
      id: workspaceId,
      ownerId: userId,
      owner: buildUser(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutopilotTickService,
        { provide: PrismaService, useValue: prisma },
        { provide: AutopilotDispatchService, useValue: dispatchService },
      ],
    }).compile();

    service = module.get(AutopilotTickService);
  });

  it('dispatches due configs once and updates lastRunDateKey', async () => {
    prisma.autopilotConfig.findMany.mockResolvedValue([config]);
    dispatchService.dispatch.mockResolvedValue({
      success: true,
      nextPillarIndex: 1,
    });
    prisma.autopilotConfig.update.mockResolvedValue({
      ...config,
      lastRunDateKey: '2026-06-26',
      lastPillarIndex: 1,
    });

    const now = new Date('2026-06-26T13:00:00.000Z');
    const dispatched = await service.processDueConfigs(now);

    expect(dispatched).toBe(1);
    expect(dispatchService.dispatch).toHaveBeenCalledTimes(1);
    expect(prisma.autopilotConfig.update).toHaveBeenCalledWith({
      where: { id: config.id },
      data: {
        lastRunDateKey: '2026-06-26',
        lastPillarIndex: 1,
      },
    });
  });

  it('skips configs that already ran today', async () => {
    prisma.autopilotConfig.findMany.mockResolvedValue([
      { ...config, lastRunDateKey: '2026-06-26' },
    ]);

    const now = new Date('2026-06-26T13:00:00.000Z');
    const dispatched = await service.processDueConfigs(now);

    expect(dispatched).toBe(0);
    expect(dispatchService.dispatch).not.toHaveBeenCalled();
  });
});
