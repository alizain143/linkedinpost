import { Test, TestingModule } from '@nestjs/testing';
import { PostPackageStatus, PostType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPost,
  buildUser,
  postId,
  userId,
  workspaceId,
} from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CalendarService } from './calendar.service';
import { CalendarView } from './dto/calendar-query.dto';

describe('CalendarService', () => {
  let service: CalendarService;
  const prisma = createMockPrismaService();
  const workspacesService = { assertMember: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspacesService.assertMember.mockResolvedValue(undefined);
    prisma.user.findUniqueOrThrow.mockResolvedValue(buildUser());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkspacesService, useValue: workspacesService },
      ],
    }).compile();

    service = module.get(CalendarService);
  });

  describe('getCalendar month view', () => {
    it('returns month grid with grouped posts', async () => {
      prisma.postPackage.findMany.mockResolvedValue([
        buildPost({
          id: postId,
          hook: 'Scheduled post',
          status: PostPackageStatus.scheduled,
          scheduledAt: new Date('2026-06-27T15:00:00.000Z'),
          pillar: 'How-to',
          postType: PostType.list_post,
        }),
      ]);

      const result = await service.getCalendar(workspaceId, userId, {
        view: CalendarView.month,
        date: '2026-06-15',
      });

      expect(result.view).toBe(CalendarView.month);
      if (result.view !== CalendarView.month) {
        return;
      }

      expect(workspacesService.assertMember).toHaveBeenCalledWith(
        userId,
        workspaceId,
      );
      expect(result.view).toBe(CalendarView.month);
      expect(result).toMatchObject({
        year: 2026,
        month: 6,
        timezone: 'America/New_York',
      });
      const todayCell = result.cells.find((cell) => cell.date === '2026-06-27');
      expect(todayCell?.posts).toHaveLength(1);
      expect(todayCell?.posts[0]).toMatchObject({
        id: postId,
        hook: 'Scheduled post',
        pillar: 'How-to',
      });
    });

    it('returns empty cells when no scheduled posts', async () => {
      prisma.postPackage.findMany.mockResolvedValue([]);

      const result = await service.getCalendar(workspaceId, userId, {
        view: CalendarView.month,
        date: '2026-06-15',
      });

      expect(result.view).toBe(CalendarView.month);
      if (result.view !== CalendarView.month) {
        return;
      }

      expect(result.cells.every((cell) => cell.posts.length === 0)).toBe(true);
    });
  });

  describe('getCalendar week view', () => {
    it('returns seven days for the anchor week', async () => {
      prisma.postPackage.findMany.mockResolvedValue([]);

      const result = await service.getCalendar(workspaceId, userId, {
        view: CalendarView.week,
        date: '2026-06-27',
      });

      expect(result.view).toBe(CalendarView.week);
      if (result.view !== CalendarView.week) {
        return;
      }

      expect(result.days).toHaveLength(7);
      expect(result).toMatchObject({
        startDate: '2026-06-22',
        endDate: '2026-06-28',
      });
    });
  });

  describe('getCalendar list view', () => {
    it('returns items ordered by scheduledAt with limit', async () => {
      prisma.postPackage.findMany.mockResolvedValue([
        buildPost({
          id: 'aaaa',
          scheduledAt: new Date('2026-06-28T10:00:00.000Z'),
          status: PostPackageStatus.scheduled,
        }),
        buildPost({
          id: 'bbbb',
          scheduledAt: new Date('2026-06-29T10:00:00.000Z'),
          status: PostPackageStatus.published,
        }),
      ]);

      const result = await service.getCalendar(workspaceId, userId, {
        view: CalendarView.list,
        date: '2026-06-27',
        limit: 1,
      });

      expect(result.view).toBe(CalendarView.list);
      if (result.view !== CalendarView.list) {
        return;
      }

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('aaaa');
      expect(result.rangeStart).toBeInstanceOf(Date);
      expect(result.rangeEnd).toBeInstanceOf(Date);
    });

    it('filters posts by status', async () => {
      prisma.postPackage.findMany.mockResolvedValue([]);

      await service.getCalendar(workspaceId, userId, {
        view: CalendarView.list,
        status: [PostPackageStatus.scheduled],
      });

      expect(prisma.postPackage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: [PostPackageStatus.scheduled] },
          }),
        }),
      );
    });
  });
});
