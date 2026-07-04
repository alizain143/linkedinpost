import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GenerationJobType,
  PostPackageStatus,
  Prisma,
} from '@prisma/client';
import { MEDIA_GENERATION_CREDIT_COST } from '../../common/constants/media.constants';
import { NOT_DELETED } from '../../common/constants/soft-delete.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { MediaService } from '../media/media.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { toGenerationJobResponse } from '../generation/generation-job.mapper';
import { MediaJobInput } from './media-generation.types';

@Injectable()
export class MediaJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly enqueueService: GenerationJobEnqueueService,
    private readonly creditsService: CreditsService,
    private readonly mediaService: MediaService,
  ) {}

  async enqueueMedia(workspaceId: string, userId: string, postId: string) {
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

    if (post.status !== PostPackageStatus.draft) {
      throw new ConflictException({
        error: 'Media can only be generated for draft posts',
        code: 'INVALID_POST_STATUS',
      });
    }

    const existingMedia = await this.mediaService.listForPost(postId);
    if (existingMedia.length > 0) {
      throw new ConflictException({
        error: 'Post already has media attached',
        code: 'POST_ALREADY_HAS_MEDIA',
      });
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

    await this.creditsService.assertHasCredits(
      userId,
      MEDIA_GENERATION_CREDIT_COST,
    );

    const input: MediaJobInput = {
      workspaceId,
      userId,
      postPackageId: postId,
      topic: post.topic ?? undefined,
      postType: post.postType,
      tone: post.tone,
      pillar: post.pillar,
      contentProfileId: post.contentProfileId,
    };

    const job = await this.enqueueService.enqueue({
      workspaceId,
      userId,
      type: GenerationJobType.media,
      flowId: 'post-media',
      promptVersion: 'v1',
      creditCost: MEDIA_GENERATION_CREDIT_COST,
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
