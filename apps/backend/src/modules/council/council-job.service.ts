import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GenerationJobType,
  PostPackageStatus,
  PostSource,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { GenerationJobEnqueueService } from '../job-queue/generation-job-enqueue.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CouncilInput } from '../generation/generation.types';
import { CouncilRequestDto } from './dto/council-request.dto';
import { toCouncilTimelineResponse } from './council.mapper';
import { toGenerationJobResponse } from '../generation/generation-job.mapper';

export interface EnqueueCouncilOptions {
  source?: PostSource;
  scheduledAt?: Date;
  creditCost?: number;
}

@Injectable()
export class CouncilJobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly enqueueService: GenerationJobEnqueueService,
    private readonly creditsService: CreditsService,
  ) {}

  async enqueueCouncil(
    workspaceId: string,
    userId: string,
    dto: CouncilRequestDto,
    options?: EnqueueCouncilOptions,
  ) {
    await this.workspacesService.assertMember(userId, workspaceId);
    this.enqueueService.assertRedisAvailable();

    const source = options?.source ?? PostSource.generation;
    const creditCost = options?.creditCost ?? 3;

    await this.creditsService.assertHasCredits(userId, creditCost);

    const input: CouncilInput = {
      workspaceId,
      userId,
      topic: dto.topic,
      postType: dto.postType,
      tone: dto.tone,
      pillar: dto.pillar,
      contentProfileId: dto.contentProfileId,
      additionalContext: dto.additionalContext,
      brief: dto.brief,
      mediaCustomPrompt: dto.mediaCustomPrompt,
      mediaMode: dto.mediaMode,
      mediaTemplateId: dto.mediaTemplateId,
    };

    const placeholderHook = dto.topic?.trim() || 'Generating…';

    const post = await this.prisma.postPackage.create({
      data: {
        workspaceId,
        contentProfileId: dto.contentProfileId,
        hook: placeholderHook,
        topic: dto.topic,
        postType: dto.postType,
        tone: dto.tone,
        pillar: dto.pillar,
        mediaCustomPrompt: dto.mediaCustomPrompt,
        mediaMode: dto.mediaMode,
        mediaTemplateId: dto.mediaTemplateId,
        source,
        status: PostPackageStatus.text_generating,
        ...(options?.scheduledAt ? { scheduledAt: options.scheduledAt } : {}),
      },
    });

    const job = await this.enqueueService.enqueue({
      workspaceId,
      userId,
      type: GenerationJobType.council,
      flowId: 'council',
      promptVersion: 'v1',
      creditCost,
      input: input as unknown as Prisma.InputJsonValue,
      postPackageId: post.id,
    });

    const fullJob = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: job.id },
      include: {
        councilEvents: { orderBy: { stepOrder: 'asc' } },
      },
    });

    return toGenerationJobResponse(fullJob);
  }

  async getCouncilHistory(workspaceId: string, postId: string, userId: string) {
    await this.workspacesService.assertMember(userId, workspaceId);

    const post = await this.prisma.postPackage.findFirst({
      where: { id: postId, workspaceId },
    });

    if (!post) {
      throw new NotFoundException({
        error: 'Post not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const jobs = await this.prisma.generationJob.findMany({
      where: {
        postPackageId: postId,
        type: GenerationJobType.council,
      },
      include: {
        councilEvents: { orderBy: { stepOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return toCouncilTimelineResponse(postId, jobs);
  }
}
