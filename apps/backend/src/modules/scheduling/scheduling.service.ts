import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostPackageStatus } from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishJobEnqueueService } from '../linkedin/publish-job-enqueue.service';
import { toPostPackageResponse } from '../posts/post.mapper';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ListScheduledQueryDto } from './dto/list-scheduled-query.dto';
import { SchedulePostDto } from './dto/schedule-post.dto';
import { assertScheduleTransition } from './scheduling-status.transitions';
import {
  resolveEffectiveScheduledAt,
  validateScheduledAt,
} from './scheduling.validation';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
    private readonly publishJobEnqueueService: PublishJobEnqueueService,
  ) {}

  private validationOptions() {
    return {
      minLeadMinutes: this.configService.get<number>(
        'scheduling.minLeadMinutes',
        15,
      ),
      maxDays: this.configService.get<number>('scheduling.maxDays', 90),
    };
  }

  private async findPostInWorkspace(workspaceId: string, id: string) {
    const post = await this.prisma.postPackage.findFirst({
      where: { id, workspaceId, ...NOT_DELETED },
      include: { _count: { select: { versions: true } } },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    return post;
  }

  async schedule(
    workspaceId: string,
    postId: string,
    userId: string,
    dto: SchedulePostDto,
  ) {
    // #region agent log
    fetch('http://127.0.0.1:7936/ingest/839fd5aa-975f-4d2f-afc3-4e50b695a8d5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'c80d58',
      },
      body: JSON.stringify({
        sessionId: 'c80d58',
        location: 'scheduling.service.ts:schedule:entry',
        message: 'Schedule request received',
        data: {
          workspaceId,
          postId,
          scheduledAt: dto.scheduledAt?.toISOString?.() ?? String(dto.scheduledAt),
        },
        timestamp: Date.now(),
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, postId);

    // #region agent log
    fetch('http://127.0.0.1:7936/ingest/839fd5aa-975f-4d2f-afc3-4e50b695a8d5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'c80d58',
      },
      body: JSON.stringify({
        sessionId: 'c80d58',
        location: 'scheduling.service.ts:schedule:postLoaded',
        message: 'Post loaded for scheduling',
        data: { postId, status: existing.status },
        timestamp: Date.now(),
        hypothesisId: 'B',
      }),
    }).catch(() => {});
    // #endregion

    assertScheduleTransition(existing.status, PostPackageStatus.scheduled);
    validateScheduledAt(dto.scheduledAt, this.validationOptions());

    // #region agent log
    fetch('http://127.0.0.1:7936/ingest/839fd5aa-975f-4d2f-afc3-4e50b695a8d5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'c80d58',
      },
      body: JSON.stringify({
        sessionId: 'c80d58',
        location: 'scheduling.service.ts:schedule:preEnqueue',
        message: 'Validation passed, checking Redis',
        data: {
          redisEnabled: this.publishJobEnqueueService.isEnabled(),
        },
        timestamp: Date.now(),
        hypothesisId: 'A',
      }),
    }).catch(() => {});
    // #endregion

    this.publishJobEnqueueService.assertRedisAvailable();

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    const scheduled = await this.prisma.postPackage.updateMany({
      where: {
        id: postId,
        workspaceId,
        ...NOT_DELETED,
        status: PostPackageStatus.approved,
      },
      data: {
        status: PostPackageStatus.scheduled,
        scheduledAt: dto.scheduledAt,
      },
    });

    if (scheduled.count === 0) {
      throw new ConflictException({
        error: 'Post is no longer approved and cannot be scheduled',
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    try {
      await this.publishJobEnqueueService.enqueuePublish(
        postId,
        dto.scheduledAt,
        workspace.ownerId,
      );
      // #region agent log
      fetch('http://127.0.0.1:7936/ingest/839fd5aa-975f-4d2f-afc3-4e50b695a8d5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'c80d58',
        },
        body: JSON.stringify({
          sessionId: 'c80d58',
          location: 'scheduling.service.ts:schedule:enqueueSuccess',
          message: 'Publish job enqueued',
          data: { postId },
          timestamp: Date.now(),
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7936/ingest/839fd5aa-975f-4d2f-afc3-4e50b695a8d5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'c80d58',
        },
        body: JSON.stringify({
          sessionId: 'c80d58',
          location: 'scheduling.service.ts:schedule:enqueueFailed',
          message: 'Publish job enqueue failed',
          data: {
            postId,
            errorName: error instanceof Error ? error.name : 'unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
          },
          timestamp: Date.now(),
          hypothesisId: 'A',
        }),
      }).catch(() => {});
      // #endregion
      await this.prisma.postPackage.updateMany({
        where: {
          id: postId,
          workspaceId,
          status: PostPackageStatus.scheduled,
          scheduledAt: dto.scheduledAt,
        },
        data: {
          status: PostPackageStatus.approved,
          scheduledAt: null,
        },
      });
      throw error;
    }

    const post = await this.prisma.postPackage.findFirstOrThrow({
      where: { id: postId, workspaceId, ...NOT_DELETED },
      include: { _count: { select: { versions: true } } },
    });

    return toPostPackageResponse(post);
  }

  async reschedule(
    workspaceId: string,
    postId: string,
    userId: string,
    dto: SchedulePostDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, postId);

    if (existing.status !== PostPackageStatus.scheduled) {
      throw new ConflictException({
        error: 'Only scheduled posts can be rescheduled',
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    validateScheduledAt(dto.scheduledAt, this.validationOptions());

    this.publishJobEnqueueService.assertRedisAvailable();

    const previousScheduledAt = existing.scheduledAt;
    const post = await this.prisma.postPackage.update({
      where: { id: postId },
      data: { scheduledAt: dto.scheduledAt },
      include: { _count: { select: { versions: true } } },
    });

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    try {
      await this.publishJobEnqueueService.enqueuePublish(
        postId,
        dto.scheduledAt,
        workspace.ownerId,
      );
    } catch (error) {
      await this.prisma.postPackage.update({
        where: { id: postId },
        data: { scheduledAt: previousScheduledAt },
      });
      throw error;
    }

    return toPostPackageResponse(post);
  }

  async cancelSchedule(workspaceId: string, postId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, postId);

    assertScheduleTransition(existing.status, PostPackageStatus.approved);

    const post = await this.prisma.postPackage.update({
      where: { id: postId },
      data: {
        status: PostPackageStatus.approved,
        scheduledAt: null,
      },
      include: { _count: { select: { versions: true } } },
    });

    await this.publishJobEnqueueService.cancelPublish(postId);

    return toPostPackageResponse(post);
  }

  async scheduleAutopilotPost(
    workspaceId: string,
    postId: string,
    preferredScheduledAt: Date | null,
  ): Promise<boolean> {
    const existing = await this.prisma.postPackage.findFirst({
      where: { id: postId, workspaceId, ...NOT_DELETED },
    });

    if (!existing) {
      return false;
    }

    if (existing.status !== PostPackageStatus.ready_for_approval) {
      return false;
    }

    try {
      this.publishJobEnqueueService.assertRedisAvailable();
    } catch {
      this.logger.warn(
        `Skipping autopilot auto-schedule for post ${postId}: Redis unavailable`,
      );
      return false;
    }

    const validationOptions = this.validationOptions();
    const baseScheduledAt =
      preferredScheduledAt ?? existing.scheduledAt ?? new Date();
    const scheduledAt = resolveEffectiveScheduledAt(
      baseScheduledAt,
      validationOptions,
    );

    validateScheduledAt(scheduledAt, validationOptions);

    const approved = await this.prisma.postPackage.updateMany({
      where: {
        id: postId,
        workspaceId,
        ...NOT_DELETED,
        status: PostPackageStatus.ready_for_approval,
      },
      data: {
        status: PostPackageStatus.approved,
        submittedForApprovalAt: null,
        approvalFeedback: null,
      },
    });

    if (approved.count === 0) {
      return false;
    }

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    const scheduled = await this.prisma.postPackage.updateMany({
      where: {
        id: postId,
        workspaceId,
        ...NOT_DELETED,
        status: PostPackageStatus.approved,
      },
      data: {
        status: PostPackageStatus.scheduled,
        scheduledAt,
      },
    });

    if (scheduled.count === 0) {
      return false;
    }

    try {
      await this.publishJobEnqueueService.enqueuePublish(
        postId,
        scheduledAt,
        workspace.ownerId,
      );
      return true;
    } catch (error) {
      await this.prisma.postPackage.updateMany({
        where: {
          id: postId,
          workspaceId,
          status: PostPackageStatus.scheduled,
          scheduledAt,
        },
        data: {
          status: PostPackageStatus.approved,
          scheduledAt: null,
        },
      });
      this.logger.warn(
        `Autopilot auto-schedule failed for post ${postId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  async listUpcoming(
    workspaceId: string,
    userId: string,
    query: ListScheduledQueryDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const now = new Date();

    const posts = await this.prisma.postPackage.findMany({
      where: {
        workspaceId,
        ...NOT_DELETED,
        status: PostPackageStatus.scheduled,
        scheduledAt: {
          gt: now,
          ...(query.from ? { gte: query.from } : {}),
          ...(query.to ? { lte: query.to } : {}),
        },
      },
      include: { _count: { select: { versions: true } } },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      skip: offset,
    });

    return posts.map((post) => toPostPackageResponse(post));
  }
}
