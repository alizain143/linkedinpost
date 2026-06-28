import { Injectable } from '@nestjs/common';
import { PostPackageStatus, PostSource } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  DEFAULT_TIMEZONE,
  getLocalDateParts,
  getMonthQueryRange,
} from '../calendar/calendar-date.util';

const PREVIEW_LENGTH = 120;

function buildPreview(body: string | null): string | null {
  if (!body) {
    return null;
  }
  const trimmed = body.trim();
  if (trimmed.length <= PREVIEW_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, PREVIEW_LENGTH)}…`;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly creditsService: CreditsService,
  ) {}

  async getStats(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const timezone = user.timezone || DEFAULT_TIMEZONE;
    const now = new Date();
    const { year, month } = getLocalDateParts(now, timezone);
    const { rangeStart: monthStart, rangeEnd: monthEnd } = getMonthQueryRange(
      year,
      month,
      timezone,
    );

    const [
      drafts,
      awaitingApproval,
      inProgress,
      scheduled,
      publishedThisMonth,
      generatedThisMonth,
      nextScheduled,
      recentDrafts,
    ] = await Promise.all([
      this.prisma.postPackage.count({
        where: { workspaceId, status: PostPackageStatus.draft, ...NOT_DELETED },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: PostPackageStatus.ready_for_approval,
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: {
            in: [
              PostPackageStatus.text_generating,
              PostPackageStatus.text_reviewing,
              PostPackageStatus.media_generating,
              PostPackageStatus.publishing,
            ],
          },
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: {
            in: [PostPackageStatus.scheduled, PostPackageStatus.publishing],
          },
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: PostPackageStatus.published,
          publishedAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          ...NOT_DELETED,
          source: {
            in: [
              PostSource.generation,
              PostSource.autopilot,
              PostSource.calendar,
            ],
          },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.postPackage.findFirst({
        where: {
          workspaceId,
          ...NOT_DELETED,
          status: PostPackageStatus.scheduled,
          scheduledAt: { gt: now },
        },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, hook: true, scheduledAt: true },
      }),
      this.prisma.postPackage.findMany({
        where: { workspaceId, status: PostPackageStatus.draft, ...NOT_DELETED },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          hook: true,
          body: true,
          postType: true,
          tone: true,
          pillar: true,
          updatedAt: true,
        },
      }),
    ]);

    const creditBalance = await this.creditsService.getBalance(userId, now);

    return {
      plan: user.plan,
      credits: {
        used: creditBalance.used,
        limit: creditBalance.limit,
        percentUsed: creditBalance.percentUsed,
      },
      counts: {
        drafts,
        awaitingApproval,
        inProgress,
        scheduled,
        publishedThisMonth,
        generatedThisMonth,
      },
      nextScheduled: nextScheduled
        ? {
            postId: nextScheduled.id,
            hook: nextScheduled.hook,
            scheduledAt: nextScheduled.scheduledAt,
          }
        : null,
      recentDrafts: recentDrafts.map((draft) => ({
        id: draft.id,
        hook: draft.hook,
        preview: buildPreview(draft.body),
        postType: draft.postType,
        tone: draft.tone,
        pillar: draft.pillar,
        updatedAt: draft.updatedAt,
      })),
    };
  }
}
