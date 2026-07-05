import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GenerationJobType,
  MediaFormat,
  MediaMode,
  PostPackageStatus,
  Prisma,
} from '@prisma/client';
import { resolveMediaGenerationCreditCost } from './media-credit.util';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { GenerateMediaRequestDto } from '../generation/dto/generate-media-request.dto';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { MediaService } from '../media/media.service';
import { MediaTemplateResolveService } from '../media-templates/media-template-resolve.service';
import { toDbMediaTemplateId } from '../media-templates/media-template-id.util';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { toGenerationJobResponse } from '../generation/generation-job.mapper';
import { MediaJobInput } from './media-generation.types';

const MEDIA_ELIGIBLE_STATUSES: PostPackageStatus[] = [
  PostPackageStatus.draft,
  PostPackageStatus.ready_for_approval,
];

@Injectable()
export class MediaJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly enqueueService: GenerationJobEnqueueService,
    private readonly creditsService: CreditsService,
    private readonly mediaService: MediaService,
    private readonly mediaTemplateResolve: MediaTemplateResolveService,
  ) {}

  async enqueueMedia(
    workspaceId: string,
    userId: string,
    postId: string,
    dto: GenerateMediaRequestDto = {},
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    this.enqueueService.assertRedisAvailable();

    const post = await this.prisma.postPackage.findFirst({
      where: { id: postId, workspaceId, ...NOT_DELETED },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    if (!MEDIA_ELIGIBLE_STATUSES.includes(post.status)) {
      throw new ConflictException({
        error:
          'Media can only be generated for draft or ready-for-approval posts',
        code: 'INVALID_POST_STATUS',
      });
    }

    const existingMedia = await this.mediaService.listForPost(postId);
    if (existingMedia.length > 0) {
      if (!dto.replace) {
        throw new ConflictException({
          error: 'Post already has media attached',
          code: 'POST_ALREADY_HAS_MEDIA',
        });
      }
      await this.mediaService.archiveActiveForPost(postId);
    }

    const activeJob = await this.prisma.generationJob.findFirst({
      where: {
        postPackageId: postId,
        type: GenerationJobType.media,
        status: { in: ['pending', 'running'] },
      },
    });

    if (activeJob) {
      throw new ConflictException({
        error: 'Media generation already in progress',
        code: 'MEDIA_JOB_IN_PROGRESS',
      });
    }

    const mediaMode =
      dto.mediaMode ??
      post.mediaMode ??
      (await this.mediaTemplateResolve.resolveMode({
        workspaceId,
        contentProfileId: post.contentProfileId,
      }));

    const mediaFormat =
      dto.mediaFormat ?? post.mediaFormat ?? MediaFormat.single;

    const carouselSlideCount =
      dto.carouselSlideCount ?? post.carouselSlideCount ?? undefined;

    const mediaTemplateId =
      dto.mediaTemplateId ?? post.mediaTemplateId ?? undefined;

    const creditCost = resolveMediaGenerationCreditCost({
      mediaFormat,
      mediaMode,
      carouselSlideCount,
    });

    await this.creditsService.assertHasCredits(userId, creditCost);

    const mediaCustomPrompt =
      dto.mediaCustomPrompt?.trim() || post.mediaCustomPrompt || undefined;

    const postUpdate: Prisma.PostPackageUpdateInput = {};
    if (dto.mediaCustomPrompt !== undefined) {
      postUpdate.mediaCustomPrompt = dto.mediaCustomPrompt.trim() || null;
    }
    if (dto.mediaMode !== undefined) {
      postUpdate.mediaMode = dto.mediaMode;
    }
    if (dto.mediaFormat !== undefined) {
      postUpdate.mediaFormat = dto.mediaFormat;
    }
    if (dto.carouselSlideCount !== undefined) {
      postUpdate.carouselSlideCount = dto.carouselSlideCount;
    }
    if (dto.mediaTemplateId !== undefined) {
      const dbTemplateId = toDbMediaTemplateId(dto.mediaTemplateId);
      if (dbTemplateId) {
        postUpdate.mediaTemplate = { connect: { id: dbTemplateId } };
      } else {
        postUpdate.mediaTemplate = { disconnect: true };
      }
    } else if (mediaMode === MediaMode.template && !post.mediaMode) {
      postUpdate.mediaMode = MediaMode.template;
    }

    if (Object.keys(postUpdate).length > 0) {
      await this.prisma.postPackage.update({
        where: { id: postId },
        data: postUpdate,
      });
    }

    const input: MediaJobInput = {
      workspaceId,
      userId,
      postPackageId: postId,
      topic: post.topic ?? undefined,
      postType: post.postType,
      tone: post.tone,
      pillar: post.pillar,
      contentProfileId: post.contentProfileId,
      mediaCustomPrompt,
      mediaMode,
      mediaFormat,
      carouselSlideCount,
      mediaTemplateId,
      previousStatus: post.status,
    };

    const job = await this.enqueueService.enqueue({
      workspaceId,
      userId,
      type: GenerationJobType.media,
      flowId: 'post-media',
      promptVersion: 'v1',
      creditCost,
      input: input as unknown as Prisma.InputJsonValue,
      postPackageId: postId,
    });

    const fullJob = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: job.id },
      include: {
        councilEvents: { orderBy: { stepOrder: 'asc' } },
      },
    });

    return toGenerationJobResponse(fullJob);
  }
}
