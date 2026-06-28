import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PostPackage,
  PostPackageStatus,
} from '@prisma/client';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { PipelineQueryDto } from './dto/pipeline-query.dto';
import { TransitionPostStatusDto } from './dto/transition-post-status.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  assertValidTransition,
  PIPELINE_COLUMN_ORDER,
  PIPELINE_LABELS,
} from './post-status.transitions';
import { assertCouncilStatusTransition } from './council-status.transitions';
import { validateScheduledAt } from '../scheduling/scheduling.validation';
import { MediaService } from '../media/media.service';
import {
  buildVersionSnapshot,
  CONTENT_VERSION_FIELDS,
  toPostPackageResponse,
  toPostPackageSummary,
  toPostVersionResponse,
} from './post.mapper';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly mediaService: MediaService,
  ) {}

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

  private assertEditable(post: PostPackage) {
    if (post.status !== PostPackageStatus.draft) {
      throw new ConflictException({
        error: 'Only draft posts can be edited or deleted',
        code: 'POST_NOT_EDITABLE',
      });
    }
  }

  private async validateContentProfile(
    workspaceId: string,
    contentProfileId?: string,
  ) {
    if (!contentProfileId) {
      return;
    }

    const profile = await this.prisma.contentProfile.findFirst({
      where: { id: contentProfileId, workspaceId, ...NOT_DELETED },
    });

    if (!profile) {
      throw new NotFoundException({
        error: 'Content profile not found in this workspace',
        code: 'RESOURCE_NOT_FOUND',
      });
    }
  }

  private contentFieldsChanged(
    existing: PostPackage,
    dto: UpdatePostDto,
  ): boolean {
    return CONTENT_VERSION_FIELDS.some((field) => {
      if (dto[field] === undefined) {
        return false;
      }
      if (field === 'tags') {
        const next = dto.tags ?? [];
        return (
          next.length !== existing.tags.length ||
          next.some((tag, i) => tag !== existing.tags[i])
        );
      }
      return dto[field] !== existing[field];
    });
  }

  private applyApprovalFieldUpdates(
    existing: PostPackage,
    to: PostPackageStatus,
    feedback?: string | null,
  ): {
    submittedForApprovalAt?: Date | null;
    approvalFeedback?: string | null;
  } {
    if (
      existing.status === PostPackageStatus.draft &&
      to === PostPackageStatus.ready_for_approval
    ) {
      return {
        submittedForApprovalAt: new Date(),
        approvalFeedback: null,
      };
    }

    if (
      existing.status === PostPackageStatus.ready_for_approval &&
      to === PostPackageStatus.approved
    ) {
      return { approvalFeedback: null };
    }

    if (
      existing.status === PostPackageStatus.ready_for_approval &&
      to === PostPackageStatus.draft
    ) {
      return {
        approvalFeedback: feedback ?? null,
        submittedForApprovalAt: null,
      };
    }

    return {};
  }

  private async updatePostStatus(
    existing: PostPackage,
    to: PostPackageStatus,
    options?: {
      scheduledAt?: Date;
      approvalFeedback?: string | null;
    },
  ) {
    if (to === PostPackageStatus.scheduled) {
      validateScheduledAt(options?.scheduledAt);
    }

    const updateData: {
      status: PostPackageStatus;
      scheduledAt?: Date | null;
      publishedAt?: Date | null;
      submittedForApprovalAt?: Date | null;
      approvalFeedback?: string | null;
    } = {
      status: to,
      ...this.applyApprovalFieldUpdates(existing, to, options?.approvalFeedback),
    };

    if (to === PostPackageStatus.scheduled) {
      updateData.scheduledAt = options!.scheduledAt!;
    } else if (
      existing.status === PostPackageStatus.scheduled &&
      (to === PostPackageStatus.draft || to === PostPackageStatus.approved)
    ) {
      updateData.scheduledAt = null;
    }

    if (existing.publishedAt && to !== PostPackageStatus.published) {
      updateData.publishedAt = null;
    }

    const post = await this.prisma.$transaction(async (tx) => {
      if (
        existing.status === PostPackageStatus.ready_for_approval &&
        to !== PostPackageStatus.ready_for_approval
      ) {
        await tx.approvalToken.updateMany({
          where: {
            postPackageId: existing.id,
            revokedAt: null,
            usedAt: null,
          },
          data: { revokedAt: new Date() },
        });
      }

      return tx.postPackage.update({
        where: { id: existing.id },
        data: updateData,
        include: { _count: { select: { versions: true } } },
      });
    });

    return toPostPackageResponse(post);
  }

  async list(
    workspaceId: string,
    userId: string,
    query: ListPostsQueryDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const status = query.status ?? [PostPackageStatus.draft];
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const posts = await this.prisma.postPackage.findMany({
      where: {
        workspaceId,
        ...NOT_DELETED,
        status: { in: status },
        ...(query.postType ? { postType: query.postType } : {}),
      },
      include: { _count: { select: { versions: true } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return posts.map((post) => toPostPackageResponse(post));
  }

  async getOne(workspaceId: string, id: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const post = await this.findPostInWorkspace(workspaceId, id);
    const media = await this.mediaService.listForPost(id);
    return toPostPackageResponse(post, undefined, media);
  }

  async create(workspaceId: string, userId: string, dto: CreatePostDto) {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.validateContentProfile(workspaceId, dto.contentProfileId);

    const tags = dto.tags ?? [];

    return this.prisma.$transaction(async (tx) => {
      const post = await tx.postPackage.create({
        data: {
          workspaceId,
          contentProfileId: dto.contentProfileId ?? null,
          hook: dto.hook,
          body: dto.body ?? null,
          cta: dto.cta ?? null,
          tags,
          topic: dto.topic ?? null,
          postType: dto.postType ?? null,
          tone: dto.tone ?? null,
          pillar: dto.pillar ?? null,
          versions: {
            create: {
              versionNumber: 1,
              ...buildVersionSnapshot({
                hook: dto.hook,
                body: dto.body ?? null,
                cta: dto.cta ?? null,
                tags,
              }),
            },
          },
        },
        include: { _count: { select: { versions: true } } },
      });

      return toPostPackageResponse(post);
    });
  }

  async update(
    workspaceId: string,
    id: string,
    userId: string,
    dto: UpdatePostDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, id);
    this.assertEditable(existing);

    if (dto.contentProfileId !== undefined) {
      await this.validateContentProfile(workspaceId, dto.contentProfileId);
    }

    const shouldVersion = this.contentFieldsChanged(existing, dto);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.postPackage.update({
        where: { id },
        data: {
          ...(dto.hook !== undefined ? { hook: dto.hook } : {}),
          ...(dto.body !== undefined ? { body: dto.body } : {}),
          ...(dto.cta !== undefined ? { cta: dto.cta } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
          ...(dto.postType !== undefined ? { postType: dto.postType } : {}),
          ...(dto.tone !== undefined ? { tone: dto.tone } : {}),
          ...(dto.pillar !== undefined ? { pillar: dto.pillar } : {}),
          ...(dto.contentProfileId !== undefined
            ? { contentProfileId: dto.contentProfileId }
            : {}),
        },
      });

      if (shouldVersion) {
        const latest = await tx.postVersion.findFirst({
          where: { postPackageId: id },
          orderBy: { versionNumber: 'desc' },
        });
        const nextVersion = (latest?.versionNumber ?? 0) + 1;

        await tx.postVersion.create({
          data: {
            postPackageId: id,
            versionNumber: nextVersion,
            ...buildVersionSnapshot({
              hook: updated.hook,
              body: updated.body,
              cta: updated.cta,
              tags: updated.tags,
            }),
          },
        });
      }

      const withCount = await tx.postPackage.findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { versions: true } } },
      });

      return toPostPackageResponse(withCount);
    });
  }

  async remove(workspaceId: string, id: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const post = await this.findPostInWorkspace(workspaceId, id);
    this.assertEditable(post);

    await this.prisma.postPackage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async listVersions(workspaceId: string, id: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    await this.findPostInWorkspace(workspaceId, id);

    const versions = await this.prisma.postVersion.findMany({
      where: { postPackageId: id },
      orderBy: { versionNumber: 'desc' },
    });

    return versions.map(toPostVersionResponse);
  }

  async applyCouncilPipelineStatus(
    postPackageId: string,
    to: PostPackageStatus,
  ) {
    const post = await this.prisma.postPackage.findFirst({
      where: { id: postPackageId, ...NOT_DELETED },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    assertCouncilStatusTransition(post.status, to);

    await this.prisma.postPackage.update({
      where: { id: postPackageId },
      data: { status: to },
    });
  }

  async transitionStatus(
    workspaceId: string,
    id: string,
    userId: string,
    dto: TransitionPostStatusDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, id);

    assertValidTransition(existing.status, dto.status);

    return this.updatePostStatus(existing, dto.status, {
      scheduledAt: dto.scheduledAt,
    });
  }

  async approvePost(workspaceId: string, id: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, id);
    return this.applyApprovalAction(existing, 'approve');
  }

  async requestChangesPost(
    workspaceId: string,
    id: string,
    userId: string,
    feedback: string,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, id);
    return this.applyApprovalAction(existing, 'request-changes', feedback);
  }

  async rejectPost(
    workspaceId: string,
    id: string,
    userId: string,
    feedback?: string,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, id);
    return this.applyApprovalAction(existing, 'reject', feedback);
  }

  async applyApprovalAction(
    post: PostPackage & { _count?: { versions: number } },
    action: 'approve' | 'request-changes' | 'reject',
    feedback?: string,
  ) {
    const to =
      action === 'approve'
        ? PostPackageStatus.approved
        : PostPackageStatus.draft;

    assertValidTransition(post.status, to);

    return this.updatePostStatus(post, to, {
      approvalFeedback:
        action === 'approve' ? undefined : feedback ?? null,
    });
  }

  async getPipeline(
    workspaceId: string,
    userId: string,
    query: PipelineQueryDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const limitPerColumn = query.limitPerColumn ?? 20;

    const [statusCounts, ...columnPosts] = await Promise.all([
      this.prisma.postPackage.groupBy({
        by: ['status'],
        where: { workspaceId, ...NOT_DELETED },
        _count: { _all: true },
      }),
      ...PIPELINE_COLUMN_ORDER.map((status) =>
        this.prisma.postPackage.findMany({
          where: { workspaceId, status, ...NOT_DELETED },
          orderBy: { updatedAt: 'desc' },
          take: limitPerColumn,
        }),
      ),
    ]);

    const countByStatus = new Map(
      statusCounts.map((row) => [row.status, row._count._all]),
    );

    const columns = PIPELINE_COLUMN_ORDER.map((status, index) => ({
      status,
      label: PIPELINE_LABELS[status],
      count: countByStatus.get(status) ?? 0,
      posts: columnPosts[index].map(toPostPackageSummary),
    }));

    return { columns };
  }
}
