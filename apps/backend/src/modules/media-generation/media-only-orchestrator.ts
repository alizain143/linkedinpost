import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreditTransactionType,
  GenerationJobStatus,
  PostMediaType,
  PostPackageStatus,
} from '@prisma/client';
import { MEDIA_GENERATION_CREDIT_COST } from '../../common/constants/media.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CouncilMediaPhaseService } from '../council/council-media-phase.service';
import { CreditsService } from '../credits/credits.service';
import { MediaService } from '../media/media.service';
import { PostsService } from '../posts/posts.service';
import {
  MEDIA_JOB_TOTAL_STEPS,
  MediaJobResult,
  buildMediaPriorStepsFromPost,
  toCouncilInputFromPost,
} from './media-generation.types';

@Injectable()
export class MediaOnlyOrchestrator {
  private readonly logger = new Logger(MediaOnlyOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly postsService: PostsService,
    private readonly mediaService: MediaService,
    private readonly creditsService: CreditsService,
    private readonly mediaPhaseService: CouncilMediaPhaseService,
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
    const jobInput = (job.input ?? {}) as {
      mediaCustomPrompt?: string;
      mediaMode?: 'freestyle' | 'template';
      mediaFormat?: 'single' | 'carousel';
      carouselSlideCount?: number | null;
      mediaTemplateId?: string | null;
      previousStatus?: PostPackageStatus;
    };
    const previousStatus =
      jobInput.previousStatus ?? PostPackageStatus.draft;
    const input = {
      ...toCouncilInputFromPost(
        post,
        job.userId,
        jobInput.mediaCustomPrompt,
      ),
      mediaMode: jobInput.mediaMode ?? post.mediaMode ?? undefined,
      mediaFormat: jobInput.mediaFormat ?? post.mediaFormat ?? undefined,
      carouselSlideCount:
        jobInput.carouselSlideCount ?? post.carouselSlideCount ?? undefined,
      mediaTemplateId:
        jobInput.mediaTemplateId ?? post.mediaTemplateId ?? undefined,
    };
    const priorSteps = buildMediaPriorStepsFromPost(post);
    const maxMediaRegens = this.configService.get<number>(
      'council.maxMediaRegens',
      1,
    );
    const totalSteps =
      MEDIA_JOB_TOTAL_STEPS + maxMediaRegens * MEDIA_JOB_TOTAL_STEPS;

    let stepOrder = 0;
    let completedSteps = 0;
    let mediaRegenCount = 0;

    try {
      await this.postsService.applyCouncilPipelineStatus(
        post.id,
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

      let attachedMedia: Awaited<
        ReturnType<MediaService['attachCouncilMedia']>
      >;
      let attachedCarousel: Awaited<
        ReturnType<MediaService['attachCarouselMedia']>
      > | null = null;

      if (media.isCarousel && media.slides && media.slides.length > 0) {
        attachedCarousel = await this.mediaService.attachCarouselMedia({
          workspaceId: post.workspaceId,
          postPackageId: post.id,
          generationJobId,
          slides: media.slides.map((slide) => ({
            mediaType:
              slide.mediaType === 'template'
                ? PostMediaType.template
                : PostMediaType.generated,
            altText: slide.altText,
            imageBuffer: slide.imageBuffer,
            mimeType: slide.mimeType,
            sortOrder: slide.sortOrder,
          })),
        });
        attachedMedia = attachedCarousel[0];
      } else {
        attachedMedia = await this.mediaService.attachCouncilMedia({
          workspaceId: post.workspaceId,
          postPackageId: post.id,
          generationJobId,
          mediaType:
            media.mediaType === 'template'
              ? PostMediaType.template
              : PostMediaType.generated,
          altText: media.spec.altText,
          imageBuffer: media.imageBuffer,
          mimeType: media.mimeType,
        });
      }

      await this.prisma.councilEvent.update({
        where: { id: media.eventId },
        data: {
          output: {
            ...media.spec,
            postMediaId: attachedMedia.id,
            postMediaIds: attachedCarousel?.map((row) => row.id),
            slideCount: attachedCarousel?.length ?? 1,
            url: attachedMedia.url,
            imageModel: media.imageModel,
          },
        },
      });

      await this.postsService.applyCouncilPipelineStatus(
        post.id,
        previousStatus === PostPackageStatus.ready_for_approval
          ? PostPackageStatus.ready_for_approval
          : PostPackageStatus.draft,
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
            currentLabel: 'Media ready',
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
        previousStatus === PostPackageStatus.ready_for_approval
          ? PostPackageStatus.ready_for_approval
          : PostPackageStatus.draft,
      );

      await this.prisma.generationJob.update({
        where: { id: generationJobId },
        data: {
          status: GenerationJobStatus.failed,
          errorCode: 'MEDIA_GENERATION_FAILED',
          errorMessage:
            err instanceof Error ? err.message : 'Media generation failed',
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }
}
