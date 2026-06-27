import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PostPackage,
  PostPackageStatus,
} from '@prisma/client';
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
  ) {}

  private async findPostInWorkspace(workspaceId: string, id: string) {
    const post = await this.prisma.postPackage.findFirst({
      where: { id, workspaceId },
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
      where: { id: contentProfileId, workspaceId },
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
    return toPostPackageResponse(post);
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

    await this.prisma.postPackage.delete({ where: { id } });
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

  async transitionStatus(
    workspaceId: string,
    id: string,
    userId: string,
    dto: TransitionPostStatusDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    const existing = await this.findPostInWorkspace(workspaceId, id);

    assertValidTransition(existing.status, dto.status);

    if (dto.status === PostPackageStatus.scheduled) {
      if (!dto.scheduledAt) {
        throw new BadRequestException({
          error: 'scheduledAt is required when scheduling a post',
          code: 'SCHEDULED_AT_REQUIRED',
        });
      }
      if (dto.scheduledAt.getTime() <= Date.now()) {
        throw new BadRequestException({
          error: 'scheduledAt must be in the future',
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const updateData: {
      status: PostPackageStatus;
      scheduledAt?: Date | null;
      publishedAt?: Date | null;
    } = { status: dto.status };

    if (dto.status === PostPackageStatus.scheduled) {
      updateData.scheduledAt = dto.scheduledAt!;
    } else if (
      existing.status === PostPackageStatus.scheduled &&
      dto.status === PostPackageStatus.draft
    ) {
      updateData.scheduledAt = null;
    }

    if (dto.status === PostPackageStatus.published) {
      updateData.publishedAt = new Date();
    }

    const post = await this.prisma.postPackage.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { versions: true } } },
    });

    return toPostPackageResponse(post);
  }

  async getPipeline(
    workspaceId: string,
    userId: string,
    query: PipelineQueryDto,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const limitPerColumn = query.limitPerColumn ?? 20;

    const columns = await Promise.all(
      PIPELINE_COLUMN_ORDER.map(async (status) => {
        const [posts, count] = await Promise.all([
          this.prisma.postPackage.findMany({
            where: { workspaceId, status },
            orderBy: { updatedAt: 'desc' },
            take: limitPerColumn,
          }),
          this.prisma.postPackage.count({
            where: { workspaceId, status },
          }),
        ]);

        return {
          status,
          label: PIPELINE_LABELS[status],
          count,
          posts: posts.map(toPostPackageSummary),
        };
      }),
    );

    return { columns };
  }
}
