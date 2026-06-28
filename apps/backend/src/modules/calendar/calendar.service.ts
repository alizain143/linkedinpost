import { BadRequestException, Injectable } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  DEFAULT_TIMEZONE,
  getListRange,
  getMonthGrid,
  getMonthQueryRange,
  getWeekQueryRange,
  getWeekRange,
  toLocalDateKey,
  widenQueryRange,
} from './calendar-date.util';
import { toCalendarEvent } from './calendar.mapper';
import {
  CalendarListResponse,
  CalendarMonthResponse,
  CalendarResponse,
  CalendarWeekResponse,
} from './calendar.types';
import { CalendarQueryDto, CalendarView } from './dto/calendar-query.dto';

const POST_SELECT = {
  id: true,
  hook: true,
  pillar: true,
  status: true,
  postType: true,
  scheduledAt: true,
  publishedAt: true,
} as const;

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getCalendar(
    workspaceId: string,
    userId: string,
    query: CalendarQueryDto,
  ): Promise<CalendarResponse> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const timezone = user.timezone || DEFAULT_TIMEZONE;
    const anchor = this.parseAnchorDate(query.date);
    const statuses = query.status ?? [
      PostPackageStatus.scheduled,
      PostPackageStatus.publishing,
      PostPackageStatus.published,
      PostPackageStatus.failed,
    ];

    switch (query.view) {
      case CalendarView.month:
        return this.getMonthView(workspaceId, anchor, timezone, statuses);
      case CalendarView.week:
        return this.getWeekView(workspaceId, anchor, timezone, statuses);
      case CalendarView.list:
        return this.getListView(
          workspaceId,
          anchor,
          timezone,
          statuses,
          query.limit ?? 50,
        );
      default:
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Invalid calendar view',
        });
    }
  }

  private parseAnchorDate(date?: string): Date {
    if (!date) {
      return new Date();
    }

    const parsed = new Date(`${date}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid date',
      });
    }

    return parsed;
  }

  private async getMonthView(
    workspaceId: string,
    anchor: Date,
    timezone: string,
    statuses: PostPackageStatus[],
  ): Promise<CalendarMonthResponse> {
    const { year, month, cells } = getMonthGrid(anchor, timezone);
    const monthRange = getMonthQueryRange(year, month, timezone);
    const { rangeStart, rangeEnd } = widenQueryRange(
      monthRange.rangeStart,
      monthRange.rangeEnd,
    );
    const posts = await this.fetchScheduledPosts(
      workspaceId,
      rangeStart,
      rangeEnd,
      statuses,
    );
    const grouped = this.groupPostsByLocalDate(posts, timezone);

    return {
      view: CalendarView.month,
      year,
      month,
      timezone,
      cells: cells.map((cell) => ({
        ...cell,
        posts: grouped.get(cell.date) ?? [],
      })),
    };
  }

  private async getWeekView(
    workspaceId: string,
    anchor: Date,
    timezone: string,
    statuses: PostPackageStatus[],
  ): Promise<CalendarWeekResponse> {
    const week = getWeekRange(anchor, timezone);
    const weekRange = getWeekQueryRange(week.startDate, week.endDate, timezone);
    const { rangeStart, rangeEnd } = widenQueryRange(
      weekRange.rangeStart,
      weekRange.rangeEnd,
    );
    const posts = await this.fetchScheduledPosts(
      workspaceId,
      rangeStart,
      rangeEnd,
      statuses,
    );
    const grouped = this.groupPostsByLocalDate(posts, timezone);

    return {
      view: CalendarView.week,
      startDate: week.startDate,
      endDate: week.endDate,
      timezone,
      days: week.days.map((day) => ({
        ...day,
        posts: grouped.get(day.date) ?? [],
      })),
    };
  }

  private async getListView(
    workspaceId: string,
    anchor: Date,
    timezone: string,
    statuses: PostPackageStatus[],
    limit: number,
  ): Promise<CalendarListResponse> {
    const { rangeStart, rangeEnd } = getListRange(anchor, timezone);
    const queryRange = widenQueryRange(rangeStart, rangeEnd);
    const posts = await this.fetchScheduledPosts(
      workspaceId,
      queryRange.rangeStart,
      queryRange.rangeEnd,
      statuses,
    );

    const items = posts
      .map((post) => ({ post, instant: this.getCalendarInstant(post) }))
      .filter(
        ({ instant }) =>
          instant && instant >= rangeStart && instant <= rangeEnd,
      )
      .sort((a, b) => a.instant!.getTime() - b.instant!.getTime())
      .slice(0, limit)
      .map(({ post }) => toCalendarEvent(post));

    return {
      view: CalendarView.list,
      timezone,
      rangeStart,
      rangeEnd,
      items,
    };
  }

  private async fetchScheduledPosts(
    workspaceId: string,
    rangeStart: Date,
    rangeEnd: Date,
    statuses: PostPackageStatus[],
  ) {
    const nonPublishedStatuses = statuses.filter(
      (status) => status !== PostPackageStatus.published,
    );
    const queries = [];

    if (nonPublishedStatuses.length > 0) {
      queries.push(
        this.prisma.postPackage.findMany({
          where: {
            workspaceId,
            ...NOT_DELETED,
            scheduledAt: {
              not: null,
              gte: rangeStart,
              lte: rangeEnd,
            },
            status: { in: nonPublishedStatuses },
          },
          orderBy: { scheduledAt: 'asc' },
          select: POST_SELECT,
        }),
      );
    }

    if (statuses.includes(PostPackageStatus.published)) {
      queries.push(
        this.prisma.postPackage.findMany({
          where: {
            workspaceId,
            ...NOT_DELETED,
            status: PostPackageStatus.published,
            publishedAt: {
              gte: rangeStart,
              lte: rangeEnd,
            },
          },
          orderBy: { publishedAt: 'asc' },
          select: POST_SELECT,
        }),
      );
    }

    const results = await Promise.all(queries);
    const merged = new Map(results.flat().map((post) => [post.id, post]));

    return [...merged.values()].sort(
      (a, b) =>
        (this.getCalendarInstant(a)?.getTime() ?? 0) -
        (this.getCalendarInstant(b)?.getTime() ?? 0),
    );
  }

  private getCalendarInstant(post: {
    status: PostPackageStatus;
    scheduledAt: Date | null;
    publishedAt?: Date | null;
  }): Date | null {
    if (post.status === PostPackageStatus.published) {
      return post.publishedAt ?? post.scheduledAt;
    }

    return post.scheduledAt;
  }

  private groupPostsByLocalDate(
    posts: Array<{
      id: string;
      hook: string;
      pillar: string | null;
      status: PostPackageStatus;
      postType: import('@prisma/client').PostType | null;
      scheduledAt: Date | null;
      publishedAt: Date | null;
    }>,
    timezone: string,
  ) {
    const grouped = new Map<string, ReturnType<typeof toCalendarEvent>[]>();

    for (const post of posts) {
      const instant = this.getCalendarInstant(post);
      if (!instant) {
        continue;
      }

      const dateKey = toLocalDateKey(instant, timezone);
      const events = grouped.get(dateKey) ?? [];
      events.push(toCalendarEvent(post));
      grouped.set(dateKey, events);
    }

    for (const events of grouped.values()) {
      events.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
    }

    return grouped;
  }
}
