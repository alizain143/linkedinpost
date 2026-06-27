import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus, UserPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPost,
  buildUser,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspacesService.assertMember.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getStats', () => {
    it('returns aggregated stats with credit stub', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(
        buildUser({ plan: UserPlan.pro }),
      );
      prisma.postPackage.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);
      prisma.postPackage.findFirst.mockResolvedValue({
        id: buildPost().id,
        hook: 'Next post',
        scheduledAt: new Date('2026-08-01T09:00:00.000Z'),
      });
      prisma.postPackage.findMany.mockResolvedValue([
        {
          id: buildPost().id,
          hook: 'Draft hook',
          body: 'Short body',
          postType: null,
          tone: null,
          pillar: null,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getStats(workspaceId, userId);

      expect(workspacesService.assertMember).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(result.plan).toBe(UserPlan.pro);
      expect(result.credits).toEqual({ used: 0, limit: 200, percentUsed: 0 });
      expect(result.counts).toEqual({
        drafts: 5,
        scheduled: 2,
        publishedThisMonth: 1,
        generatedThisMonth: 0,
      });
      expect(result.nextScheduled).toMatchObject({
        hook: 'Next post',
      });
      expect(result.recentDrafts).toHaveLength(1);
      expect(result.recentDrafts[0].preview).toBe('Short body');
    });

    it('truncates long draft previews', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(buildUser());
      prisma.postPackage.count.mockResolvedValue(0);
      prisma.postPackage.findFirst.mockResolvedValue(null);
      prisma.postPackage.findMany.mockResolvedValue([
        {
          id: buildPost().id,
          hook: 'Long draft',
          body: 'x'.repeat(150),
          postType: null,
          tone: null,
          pillar: null,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getStats(workspaceId, userId);

      expect(result.recentDrafts[0].preview).toHaveLength(121);
      expect(result.recentDrafts[0].preview?.endsWith('…')).toBe(true);
    });

    it('returns null nextScheduled when none upcoming', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue(buildUser());
      prisma.postPackage.count.mockResolvedValue(0);
      prisma.postPackage.findFirst.mockResolvedValue(null);
      prisma.postPackage.findMany.mockResolvedValue([]);

      const result = await service.getStats(workspaceId, userId);

      expect(result.nextScheduled).toBeNull();
    });
  });
});
