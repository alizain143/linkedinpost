import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
import { validateScheduledAt } from './scheduling.validation';

@Injectable()
export class SchedulingService {
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
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, postId);

    assertScheduleTransition(existing.status, PostPackageStatus.scheduled);
    validateScheduledAt(dto.scheduledAt, this.validationOptions());

    const post = await this.prisma.postPackage.update({
      where: { id: postId },
      data: {
        status: PostPackageStatus.scheduled,
        scheduledAt: dto.scheduledAt,
      },
      include: { _count: { select: { versions: true } } },
    });

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    if (this.publishJobEnqueueService.isEnabled()) {
      await this.publishJobEnqueueService.enqueuePublish(
        postId,
        dto.scheduledAt,
        workspace.ownerId,
      );
    }

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

    const post = await this.prisma.postPackage.update({
      where: { id: postId },
      data: { scheduledAt: dto.scheduledAt },
      include: { _count: { select: { versions: true } } },
    });

    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
    });

    if (this.publishJobEnqueueService.isEnabled()) {
      await this.publishJobEnqueueService.enqueuePublish(
        postId,
        dto.scheduledAt,
        workspace.ownerId,
      );
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
