import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CouncilAgentRole,
  CreditTransactionType,
  GenerationJobStatus,
  PostMediaType,
  PostPackageStatus,
} from '@prisma/client';
import { MEDIA_GENERATION_CREDIT_COST } from '../../common/constants/media.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { MediaService } from '../media/media.service';
import { NotificationEventService } from '../notifications/notification-event.service';
import { CouncilAgentService } from './council-agent.service';
import { CouncilEventService } from './council-event.service';
import { councilTotalSteps } from './council-progress';
import { CouncilMediaPhaseService } from './council-media-phase.service';
import { PostsService } from '../posts/posts.service';
import { ReviewerOutput } from './parsers/reviewer-output.parser';

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
    private readonly notificationEvents: NotificationEventService,
    private readonly mediaPhaseService: CouncilMediaPhaseService,
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

    let priorSteps: CouncilPriorStep[] = [];
    let stepOrder = 0;
    let completedSteps = 0;
    let revisionCount = job.revisionCount;
    let mediaRegenCount = job.mediaRegenCount;

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
        passScore,
      );
      completedSteps++;

      while (
        !review.passed &&
        review.overall < passScore &&
        revisionCount < maxTextRevisions
      ) {
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
          passScore,
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

        const latestVersion = await tx.postVersion.findFirst({
          where: { postPackageId },
          orderBy: { versionNumber: 'desc' },
        });
        const nextVersion = (latestVersion?.versionNumber ?? 0) + 1;

        await tx.postVersion.create({
          data: {
            postPackageId,
            versionNumber: nextVersion,
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
      let media = await this.mediaPhaseService.executeMediaCreator({
        generationJobId,
        input,
        priorSteps,
        attempt: mediaAttempt,
        stepOrder: ++stepOrder,
        completedSteps,
        totalSteps,
      });
      completedSteps++;
      let lastMediaCreatorEventId = media.eventId;

      let mediaReview = await this.mediaPhaseService.executeMediaReviewer({
        generationJobId,
        input,
        priorSteps,
        stepOrder: ++stepOrder,
        completedSteps,
        totalSteps,
        imageBuffer: media.imageBuffer,
        mimeType: media.mimeType,
      });
      completedSteps++;

      while (!mediaReview.passed && mediaRegenCount < maxMediaRegens) {
        mediaRegenCount++;
        mediaAttempt++;

        await this.creditsService.assertHasCredits(
          job.userId,
          MEDIA_GENERATION_CREDIT_COST,
        );

        media = await this.mediaPhaseService.executeMediaCreator({
          generationJobId,
          input,
          priorSteps,
          attempt: mediaAttempt,
          stepOrder: ++stepOrder,
          completedSteps,
          totalSteps,
        });
        completedSteps++;
        lastMediaCreatorEventId = media.eventId;

        await this.creditsService.consume(
          job.userId,
          MEDIA_GENERATION_CREDIT_COST,
          CreditTransactionType.media,
          { generationJobId, reason: 'media regen' },
        );

        mediaReview = await this.mediaPhaseService.executeMediaReviewer({
          generationJobId,
          input,
          priorSteps,
          stepOrder: ++stepOrder,
          completedSteps,
          totalSteps,
          imageBuffer: media.imageBuffer,
          mimeType: media.mimeType,
        });
        completedSteps++;
      }

      if (!mediaReview.passed) {
        throw new Error('Media review failed after max regenerations');
      }

      const attachedMedia = await this.mediaService.attachCouncilMedia({
        workspaceId,
        postPackageId,
        generationJobId,
        mediaType: PostMediaType.generated,
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
          },
        },
      });

      await this.postsService.applyCouncilPipelineStatus(
        postPackageId,
        PostPackageStatus.ready_for_approval,
      );

      const workspace = await this.prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
      });

      await this.notificationEvents.emitPostReadyForApproval({
        userId: workspace.ownerId,
        workspaceId,
        postPackageId,
        postHook: job.postPackage.hook,
      });

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          revisionCount,
          mediaRegenCount,
          finalScore: review.overall,
          result: {
            postPackageId,
            revisionCount,
            mediaRegenCount,
          },
          model: job.model,
          progress: {
            currentStep: 'completed',
            currentLabel: 'Council complete',
            completedSteps: totalSteps,
            totalSteps,
            percentComplete: 100,
          },
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
    passScore: number,
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

    const result = await this.councilAgentService.runReviewer(
      input,
      priorSteps,
      { passScore },
    );

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
}
