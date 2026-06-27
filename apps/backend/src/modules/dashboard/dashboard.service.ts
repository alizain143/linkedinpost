import { Injectable } from '@nestjs/common';
import {
  PostPackageStatus,
  PostSource,
} from '@prisma/client';
import { getCreditLimitForPlan } from '../../common/constants/plan.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

const PREVIEW_LENGTH = 120;

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  );
}

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
  ) {}

  async getStats(workspaceId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const now = new Date();
    const monthStart = startOfUtcMonth(now);
    const monthEnd = endOfUtcMonth(now);

    const [
      drafts,
      scheduled,
      publishedThisMonth,
      generatedThisMonth,
      nextScheduled,
      recentDrafts,
    ] = await Promise.all([
      this.prisma.postPackage.count({
        where: { workspaceId, status: PostPackageStatus.draft },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          status: {
            in: [PostPackageStatus.scheduled, PostPackageStatus.publishing],
          },
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          status: PostPackageStatus.published,
          publishedAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      this.prisma.postPackage.count({
        where: {
          workspaceId,
          source: {
            in: [
              PostSource.generation,
              PostSource.autopilot,
              PostSource.calendar,
            ],
          },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      this.prisma.postPackage.findFirst({
        where: {
          workspaceId,
          status: PostPackageStatus.scheduled,
          scheduledAt: { gt: now },
        },
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, hook: true, scheduledAt: true },
      }),
      this.prisma.postPackage.findMany({
        where: { workspaceId, status: PostPackageStatus.draft },
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

    const creditLimit = getCreditLimitForPlan(user.plan);
    const creditsUsed = 0;

    return {
      plan: user.plan,
      credits: {
        used: creditsUsed,
        limit: creditLimit,
        percentUsed:
          creditLimit > 0 ? Math.round((creditsUsed / creditLimit) * 100) : 0,
      },
      counts: {
        drafts,
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
