import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CouncilAgentRole,
  CreditTransactionType,
  GenerationJobStatus,
  PostMediaType,
  PostPackageStatus,
} from '@prisma/client';
import { MEDIA_REGEN_CREDIT_COST } from '../../common/constants/media.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CouncilAgentService } from '../council/council-agent.service';
import { CouncilEventService } from '../council/council-event.service';
import { MediaCreatorOutput } from '../council/parsers/media-creator-output.parser';
import { CreditsService } from '../credits/credits.service';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { MediaService } from '../media/media.service';
import { PostsService } from '../posts/posts.service';
import {
  MEDIA_JOB_TOTAL_STEPS,
  MediaJobResult,
  buildMediaPriorStepsFromPost,
  toCouncilInputFromPost,
} from './media-generation.types';

interface MediaDraft {
  spec: MediaCreatorOutput;
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
  eventId: string;
}

@Injectable()
export class MediaOnlyOrchestrator {
  private readonly logger = new Logger(MediaOnlyOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly councilAgentService: CouncilAgentService,
    private readonly councilEventService: CouncilEventService,
    private readonly postsService: PostsService,
    private readonly mediaService: MediaService,
    private readonly creditsService: CreditsService,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  async run(generationJobId: string): Promise<void> {
    const job = await this.prisma.generationJob.findUniqueOrThrow({
      where: { id: generationJobId },
      include: { postPackage: true },
    });

    if (!job.postPackageId || !job.postPackage) {
      throw new Error(`Media job ${generationJobId} missing post package`);
    }

    const post = job.postPackage;
    const input = toCouncilInputFromPost(post, job.userId);
    const priorSteps = buildMediaPriorStepsFromPost(post);
    const maxMediaRegens = this.configService.get<number>(
      'council.maxMediaRegens',
      1,
    );
    const totalSteps = MEDIA_JOB_TOTAL_STEPS + maxMediaRegens * MEDIA_JOB_TOTAL_STEPS;

    let stepOrder = 0;
    let completedSteps = 0;
    let mediaRegenCount = 0;

    try {
      await this.postsService.applyCouncilPipelineStatus(
        post.id,
        PostPackageStatus.media_generating,
      );

      let mediaAttempt = 1;
      let media = await this.executeMediaCreator(
        generationJobId,
        input,
        priorSteps,
        mediaAttempt,
        ++stepOrder,
        completedSteps,
        totalSteps,
      );
      completedSteps++;

      let mediaReview = await this.executeMediaReviewer(
        generationJobId,
        input,
        priorSteps,
        ++stepOrder,
        completedSteps,
        totalSteps,
      );
      completedSteps++;

      while (!mediaReview.passed && mediaRegenCount < maxMediaRegens) {
        mediaRegenCount++;
        mediaAttempt++;

        await this.creditsService.assertHasCredits(
          job.userId,
          MEDIA_REGEN_CREDIT_COST,
        );

        media = await this.executeMediaCreator(
          generationJobId,
          input,
          priorSteps,
          mediaAttempt,
          ++stepOrder,
          completedSteps,
          totalSteps,
        );
        completedSteps++;

        await this.creditsService.consume(
          job.userId,
          MEDIA_REGEN_CREDIT_COST,
          CreditTransactionType.media,
          { generationJobId, reason: 'media regen' },
        );

        mediaReview = await this.executeMediaReviewer(
          generationJobId,
          input,
          priorSteps,
          ++stepOrder,
          completedSteps,
          totalSteps,
        );
        completedSteps++;
      }

      if (!mediaReview.passed) {
        throw new Error('Media review failed after max regenerations');
      }

      const attachedMedia = await this.mediaService.attachCouncilMedia({
        workspaceId: post.workspaceId,
        postPackageId: post.id,
        generationJobId,
        mediaType: media.spec.mediaType ?? PostMediaType.quote_card,
        altText: media.spec.altText,
        imageBuffer: media.imageBuffer,
        mimeType: media.mimeType,
      });

      await this.prisma.councilEvent.update({
        where: { id: media.eventId },
        data: {
          output: {
            ...media.spec,
            postMediaId: attachedMedia.id,
            url: attachedMedia.url,
            imageModel: media.imageModel,
          },
        },
      });

      await this.postsService.applyCouncilPipelineStatus(
        post.id,
        PostPackageStatus.draft,
      );

      const result: MediaJobResult = {
        postPackageId: post.id,
        postMediaId: attachedMedia.id,
        mediaType: attachedMedia.mediaType,
      };

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          mediaRegenCount,
          result,
          progress: {
            currentStep: 'completed',
            currentLabel: 'Quote card ready',
            completedSteps: totalSteps,
            totalSteps,
            percentComplete: 100,
          },
        },
      });
    } catch (err) {
      this.logger.error(`Media job ${generationJobId} failed`, err);

      await this.postsService.applyCouncilPipelineStatus(
        post.id,
        PostPackageStatus.failed,
      );

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          status: GenerationJobStatus.failed,
          errorCode: 'MEDIA_GENERATION_FAILED',
          errorMessage: err instanceof Error ? err.message : 'Media generation failed',
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }

  private async executeMediaCreator(
    generationJobId: string,
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    attempt: number,
    stepOrder: number,
    completedSteps: number,
    totalSteps: number,
  ): Promise<MediaDraft> {
    const started = await this.councilEventService.startEvent({
      generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      stepOrder,
      revisionAttempt: attempt,
      label: 'Media Creator generating quote card',
      completedSteps,
      totalSteps,
    });

    const result = await this.councilAgentService.runMediaCreator(
      input,
      priorSteps,
    );

    const imageResult = await this.modelRouter.image().generate({
      prompt: result.output.imagePrompt,
      width: result.output.width,
      height: result.output.height,
      headlineText: result.output.headlineText,
      styleNotes: result.output.styleNotes,
    });

    const eventOutput = {
      ...result.output,
      generated: true,
      imageModel: imageResult.model,
    };

    if (attempt === 1) {
      priorSteps.push({
        agentRole: CouncilAgentRole.media_creator,
        revisionAttempt: attempt,
        output: eventOutput,
      });
    } else {
      const idx = priorSteps.findIndex(
        (s) => s.agentRole === CouncilAgentRole.media_creator,
      );
      if (idx >= 0) {
        priorSteps[idx] = {
          agentRole: CouncilAgentRole.media_creator,
          revisionAttempt: attempt,
          output: eventOutput,
        };
      }
    }

    await this.councilEventService.completeEvent(started.id, {
      generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      label: 'Media Creator generated quote card',
      completedSteps: completedSteps + 1,
      totalSteps,
      output: eventOutput,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return {
      spec: result.output,
      imageBuffer: imageResult.imageBuffer,
      mimeType: imageResult.mimeType,
      imageModel: imageResult.model,
      eventId: started.id,
    };
  }

  private async executeMediaReviewer(
    generationJobId: string,
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    stepOrder: number,
    completedSteps: number,
    totalSteps: number,
  ) {
    const started = await this.councilEventService.startEvent({
      generationJobId,
      agentRole: CouncilAgentRole.media_reviewer,
      stepOrder,
      revisionAttempt: 1,
      label: 'Media Reviewer QA',
      completedSteps,
      totalSteps,
    });

    const result = await this.councilAgentService.runMediaReviewer(
      input,
      priorSteps,
    );

    priorSteps.push({
      agentRole: CouncilAgentRole.media_reviewer,
      revisionAttempt: 1,
      output: result.output as unknown as Record<string, unknown>,
      scores: { score: result.output.score },
    });

    await this.councilEventService.completeEvent(started.id, {
      generationJobId,
      agentRole: CouncilAgentRole.media_reviewer,
      label: result.output.passed
        ? 'Media Reviewer QA passed'
        : 'Media Reviewer QA failed',
      completedSteps: completedSteps + 1,
      totalSteps,
      output: result.output as unknown as Record<string, unknown>,
      scores: { score: result.output.score },
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return result.output;
  }
}
