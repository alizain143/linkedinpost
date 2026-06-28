import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CouncilAgentRole,
  CreditTransactionType,
  GenerationJobStatus,
  PostMediaType,
  PostPackageStatus,
  Prisma,
} from '@prisma/client';
import { MEDIA_REGEN_CREDIT_COST } from '../../common/constants/media.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { MediaService } from '../media/media.service';
import { CouncilAgentService } from './council-agent.service';
import { CouncilEventService } from './council-event.service';
import { councilTotalSteps } from './council-progress';
import { MediaCreatorOutput } from './parsers/media-creator-output.parser';
import { PostsService } from '../posts/posts.service';
import { ReviewerOutput } from './parsers/reviewer-output.parser';

interface CouncilMediaDraft {
  spec: MediaCreatorOutput;
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
}

@Injectable()
export class CouncilOrchestrator {
  private readonly logger = new Logger(CouncilOrchestrator.name);

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
      throw new Error(`Council job ${generationJobId} missing post package`);
    }

    const input = job.input as unknown as CouncilInput;
    const passScore = this.configService.get<number>('council.passScore', 75);
    const maxTextRevisions = this.configService.get<number>(
      'council.maxTextRevisions',
      1,
    );
    const maxMediaRegens = this.configService.get<number>(
      'council.maxMediaRegens',
      1,
    );
    const totalSteps = councilTotalSteps(maxTextRevisions, maxMediaRegens);

    const priorSteps: CouncilPriorStep[] = [];
    let stepOrder = 0;
    let completedSteps = 0;
    let revisionCount = 0;
    let mediaRegenCount = 0;

    const postPackageId = job.postPackageId;
    const workspaceId = job.workspaceId;

    try {
      let writerAttempt = 1;
      let draft = await this.executeWriter(
        generationJobId,
        input,
        priorSteps,
        writerAttempt,
        ++stepOrder,
        completedSteps,
        totalSteps,
      );
      completedSteps++;

      await this.prisma.postPackage.update({
        where: { id: postPackageId },
        data: {
          hook: draft.hook,
          body: draft.body,
          cta: draft.cta,
          tags: draft.tags,
        },
      });

      await this.postsService.applyCouncilPipelineStatus(
        postPackageId,
        PostPackageStatus.text_reviewing,
      );

      let reviewerAttempt = 1;
      let review = await this.executeReviewer(
        generationJobId,
        input,
        priorSteps,
        reviewerAttempt,
        ++stepOrder,
        completedSteps,
        totalSteps,
      );
      completedSteps++;

      while (!review.passed && review.overall < passScore && revisionCount < maxTextRevisions) {
        revisionCount++;
        writerAttempt++;
        reviewerAttempt++;

        await this.postsService.applyCouncilPipelineStatus(
          postPackageId,
          PostPackageStatus.text_generating,
        );

        draft = await this.executeWriter(
          generationJobId,
          input,
          priorSteps,
          writerAttempt,
          ++stepOrder,
          completedSteps,
          totalSteps,
        );
        completedSteps++;

        await this.prisma.postPackage.update({
          where: { id: postPackageId },
          data: {
            hook: draft.hook,
            body: draft.body,
            cta: draft.cta,
            tags: draft.tags,
          },
        });

        await this.postsService.applyCouncilPipelineStatus(
          postPackageId,
          PostPackageStatus.text_reviewing,
        );

        review = await this.executeReviewer(
          generationJobId,
          input,
          priorSteps,
          reviewerAttempt,
          ++stepOrder,
          completedSteps,
          totalSteps,
        );
        completedSteps++;
      }

      const finalCopy = await this.executeEditor(
        generationJobId,
        input,
        priorSteps,
        ++stepOrder,
        completedSteps,
        totalSteps,
      );
      completedSteps++;

      await this.prisma.$transaction(async (tx) => {
        await tx.postPackage.update({
          where: { id: postPackageId },
          data: {
            hook: finalCopy.hook,
            body: finalCopy.body,
            cta: finalCopy.cta,
            tags: finalCopy.tags,
            score: review.overall,
          },
        });

        await tx.postVersion.create({
          data: {
            postPackageId,
            versionNumber: 1,
            hook: finalCopy.hook,
            body: finalCopy.body,
            cta: finalCopy.cta,
            tags: finalCopy.tags,
          },
        });
      });

      await this.postsService.applyCouncilPipelineStatus(
        postPackageId,
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
      let lastMediaCreatorEventId = media.eventId;

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

        await this.creditsService.consume(
          job.userId,
          MEDIA_REGEN_CREDIT_COST,
          CreditTransactionType.media,
          { generationJobId, reason: 'media regen' },
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
        lastMediaCreatorEventId = media.eventId;

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
        workspaceId,
        postPackageId,
        generationJobId,
        mediaType: PostMediaType.quote_card,
        altText: media.spec.altText,
        imageBuffer: media.imageBuffer,
        mimeType: media.mimeType,
      });

      await this.prisma.councilEvent.update({
        where: { id: lastMediaCreatorEventId },
        data: {
          output: {
            ...media.spec,
            postMediaId: attachedMedia.id,
            url: attachedMedia.url,
            imageModel: media.imageModel,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      await this.postsService.applyCouncilPipelineStatus(
        postPackageId,
        PostPackageStatus.ready_for_approval,
      );

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          status: GenerationJobStatus.completed,
          revisionCount,
          mediaRegenCount,
          finalScore: review.overall,
          result: {
            postPackageId,
            revisionCount,
            mediaRegenCount,
          } as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
          model: job.model,
        },
      });
    } catch (err) {
      this.logger.error(`Council job ${generationJobId} failed`, err);

      await this.postsService.applyCouncilPipelineStatus(
        postPackageId,
        PostPackageStatus.failed,
      );

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          status: GenerationJobStatus.failed,
          revisionCount,
          mediaRegenCount,
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }

  private async executeWriter(
    generationJobId: string,
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    revisionAttempt: number,
    stepOrder: number,
    completedSteps: number,
    totalSteps: number,
  ) {
    const label =
      revisionAttempt === 1
        ? 'Writer creating draft v1'
        : `Writer applying revision ${revisionAttempt}`;

    const started = await this.councilEventService.startEvent({
      generationJobId,
      agentRole: CouncilAgentRole.writer,
      stepOrder,
      revisionAttempt,
      label,
      completedSteps,
      totalSteps,
    });

    const result = await this.councilAgentService.runWriter(input, priorSteps);

    priorSteps.push({
      agentRole: CouncilAgentRole.writer,
      revisionAttempt,
      output: result.output as unknown as Record<string, unknown>,
    });

    await this.councilEventService.completeEvent(started.id, {
      generationJobId,
      agentRole: CouncilAgentRole.writer,
      label:
        revisionAttempt === 1
          ? 'Writer created draft v1'
          : `Writer applied revision ${revisionAttempt}`,
      completedSteps: completedSteps + 1,
      totalSteps,
      output: result.output as unknown as Record<string, unknown>,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return result.output;
  }

  private async executeReviewer(
    generationJobId: string,
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    revisionAttempt: number,
    stepOrder: number,
    completedSteps: number,
    totalSteps: number,
  ): Promise<ReviewerOutput> {
    const started = await this.councilEventService.startEvent({
      generationJobId,
      agentRole: CouncilAgentRole.reviewer,
      stepOrder,
      revisionAttempt,
      label: `Reviewer scoring draft v${revisionAttempt}`,
      completedSteps,
      totalSteps,
    });

    const result = await this.councilAgentService.runReviewer(input, priorSteps);

    const scores = {
      overall: result.output.overall,
      hook: result.output.hook,
      voice: result.output.voice,
      clarity: result.output.clarity,
    };

    priorSteps.push({
      agentRole: CouncilAgentRole.reviewer,
      revisionAttempt,
      output: result.output as unknown as Record<string, unknown>,
      scores,
    });

    const label = result.output.passed
      ? `Reviewer scored ${result.output.overall} — approved`
      : `Reviewer scored ${result.output.overall} — needs revision`;

    await this.councilEventService.completeEvent(started.id, {
      generationJobId,
      agentRole: CouncilAgentRole.reviewer,
      label,
      completedSteps: completedSteps + 1,
      totalSteps,
      output: result.output as unknown as Record<string, unknown>,
      scores,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return result.output;
  }

  private async executeEditor(
    generationJobId: string,
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    stepOrder: number,
    completedSteps: number,
    totalSteps: number,
  ) {
    const started = await this.councilEventService.startEvent({
      generationJobId,
      agentRole: CouncilAgentRole.editor,
      stepOrder,
      revisionAttempt: 1,
      label: 'Editor polishing copy',
      completedSteps,
      totalSteps,
    });

    const result = await this.councilAgentService.runEditor(input, priorSteps);

    priorSteps.push({
      agentRole: CouncilAgentRole.editor,
      revisionAttempt: 1,
      output: result.output as unknown as Record<string, unknown>,
    });

    await this.councilEventService.completeEvent(started.id, {
      generationJobId,
      agentRole: CouncilAgentRole.editor,
      label: 'Editor finalized copy',
      completedSteps: completedSteps + 1,
      totalSteps,
      output: result.output as unknown as Record<string, unknown>,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return result.output;
  }

  private async executeMediaCreator(
    generationJobId: string,
    input: CouncilInput,
    priorSteps: CouncilPriorStep[],
    attempt: number,
    stepOrder: number,
    completedSteps: number,
    totalSteps: number,
  ): Promise<CouncilMediaDraft & { eventId: string }> {
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
        output: eventOutput as unknown as Record<string, unknown>,
      });
    } else {
      const idx = priorSteps.findIndex(
        (s) => s.agentRole === CouncilAgentRole.media_creator,
      );
      if (idx >= 0) {
        priorSteps[idx] = {
          agentRole: CouncilAgentRole.media_creator,
          revisionAttempt: attempt,
          output: eventOutput as unknown as Record<string, unknown>,
        };
      }
    }

    await this.councilEventService.completeEvent(started.id, {
      generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      label: 'Media Creator generated quote card',
      completedSteps: completedSteps + 1,
      totalSteps,
      output: eventOutput as unknown as Record<string, unknown>,
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
