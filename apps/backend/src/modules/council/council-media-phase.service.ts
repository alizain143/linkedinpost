import { Injectable } from '@nestjs/common';
import {
  CouncilAgentRole,
  CouncilEventStatus,
  PostMediaType,
  PostPackageStatus,
} from '@prisma/client';
import { suggestMediaType } from '../../common/constants/media-type-suggestion.util';
import { getTemplateDefinition } from '../media-templates/media-template-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import { ContextAssembler } from '../generation/context/context-assembler';
import {
  CouncilInput,
  CouncilPausedState,
  CouncilPriorStep,
} from '../generation/generation.types';
import { ImageScoutService } from '../image-scout/image-scout.service';
import { MediaRenderService } from '../media-templates/media-render.service';
import { PostsService } from '../posts/posts.service';
import { CouncilAgentService } from './council-agent.service';
import { CouncilEventService } from './council-event.service';
import { CouncilPausedError } from './council-paused.error';
import { MediaCreatorOutput } from './parsers/media-creator-output.parser';
import { MediaVisionReviewerService } from './media-vision-reviewer.service';

export interface CouncilMediaDraft {
  spec: MediaCreatorOutput;
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
  eventId: string;
}

@Injectable()
export class CouncilMediaPhaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly councilAgentService: CouncilAgentService,
    private readonly councilEventService: CouncilEventService,
    private readonly imageScoutService: ImageScoutService,
    private readonly mediaRenderService: MediaRenderService,
    private readonly contextAssembler: ContextAssembler,
    private readonly mediaVisionReviewer: MediaVisionReviewerService,
    private readonly postsService: PostsService,
  ) {}

  async loadPriorStepsFromEvents(
    generationJobId: string,
  ): Promise<CouncilPriorStep[]> {
    const events = await this.prisma.councilEvent.findMany({
      where: {
        generationJobId,
        status: CouncilEventStatus.completed,
      },
      orderBy: { stepOrder: 'asc' },
    });

    return events.map((event) => ({
      agentRole: event.agentRole,
      revisionAttempt: event.revisionAttempt,
      output: (event.output ?? {}) as Record<string, unknown>,
      scores: event.scores as Record<string, number> | undefined,
    }));
  }

  async runImageScoutAndPause(params: {
    generationJobId: string;
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    postPackageId: string;
    stepOrder: number;
    completedSteps: number;
    totalSteps: number;
    post: {
      hook: string;
      body?: string | null;
      topic?: string | null;
      pillar?: string | null;
    };
  }): Promise<never> {
    const started = await this.councilEventService.startEvent({
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.image_scout,
      stepOrder: params.stepOrder,
      revisionAttempt: 1,
      label: 'Image Scout finding references',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const scoutResult = await this.imageScoutService.scout(
      params.input,
      params.post,
    );

    params.priorSteps.push({
      agentRole: CouncilAgentRole.image_scout,
      revisionAttempt: 1,
      output: {
        queries: scoutResult.queries,
        candidates: scoutResult.candidates,
      },
    });

    await this.councilEventService.completeEvent(started.id, {
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.image_scout,
      label: 'Image Scout found references',
      completedSteps: params.completedSteps + 1,
      totalSteps: params.totalSteps,
      output: {
        queries: scoutResult.queries,
        candidates: scoutResult.candidates,
      },
      model: 'image-scout',
      startedAt: started.startedAt,
    });

    const pausedState: CouncilPausedState = {
      paused: true,
      pauseReason: 'awaiting_media_selection',
      mediaReferences: scoutResult.candidates,
      resumeFrom: 'media_creator',
      priorStepOrder: params.stepOrder,
      completedSteps: params.completedSteps + 1,
    };

    await this.postsService.applyCouncilPipelineStatus(
      params.postPackageId,
      PostPackageStatus.awaiting_media_selection,
    );

    await this.prisma.generationJob.update({
      where: { id: params.generationJobId },
      data: {
        result: pausedState as unknown as object,
        progress: {
          currentStep: 'awaiting_media_selection',
          currentLabel: 'Select reference images',
          completedSteps: params.completedSteps + 1,
          totalSteps: params.totalSteps,
          percentComplete: Math.round(
            ((params.completedSteps + 1) / params.totalSteps) * 100,
          ),
        },
      },
    });

    throw new CouncilPausedError();
  }

  async executeMediaCreator(params: {
    generationJobId: string;
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    attempt: number;
    stepOrder: number;
    completedSteps: number;
    totalSteps: number;
    fallbackMediaType: PostMediaType;
  }): Promise<CouncilMediaDraft> {
    const started = await this.councilEventService.startEvent({
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      stepOrder: params.stepOrder,
      revisionAttempt: params.attempt,
      label: 'Media Creator generating visual',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const result = await this.councilAgentService.runMediaCreator(
      params.input,
      params.priorSteps,
      { fallbackMediaType: params.fallbackMediaType },
    );

    const context = await this.contextAssembler.assemble(params.input);
    const rendered = await this.mediaRenderService.renderMedia(
      result.output,
      params.input,
      context.contentProfile,
    );

    const eventOutput = {
      ...result.output,
      generated: true,
      imageModel: rendered.imageModel,
    };

    if (params.attempt === 1) {
      params.priorSteps.push({
        agentRole: CouncilAgentRole.media_creator,
        revisionAttempt: params.attempt,
        output: eventOutput,
      });
    } else {
      const idx = params.priorSteps.findIndex(
        (step) => step.agentRole === CouncilAgentRole.media_creator,
      );
      if (idx >= 0) {
        params.priorSteps[idx] = {
          agentRole: CouncilAgentRole.media_creator,
          revisionAttempt: params.attempt,
          output: eventOutput,
        };
      }
    }

    await this.councilEventService.completeEvent(started.id, {
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      label: 'Media Creator generated visual',
      completedSteps: params.completedSteps + 1,
      totalSteps: params.totalSteps,
      output: eventOutput,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return {
      spec: result.output,
      imageBuffer: rendered.imageBuffer,
      mimeType: rendered.mimeType,
      imageModel: rendered.imageModel,
      eventId: started.id,
    };
  }

  async executeMediaReviewer(params: {
    generationJobId: string;
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    stepOrder: number;
    completedSteps: number;
    totalSteps: number;
    imageBuffer?: Buffer;
    mimeType?: string;
  }) {
    const started = await this.councilEventService.startEvent({
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_reviewer,
      stepOrder: params.stepOrder,
      revisionAttempt: 1,
      label: 'Media Reviewer QA',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const result =
      params.imageBuffer && params.mimeType
        ? await this.mediaVisionReviewer.review(
            params.input,
            params.priorSteps,
            params.imageBuffer,
            params.mimeType,
          )
        : await this.councilAgentService.runMediaReviewer(
            params.input,
            params.priorSteps,
          );

    params.priorSteps.push({
      agentRole: CouncilAgentRole.media_reviewer,
      revisionAttempt: 1,
      output: result.output as unknown as Record<string, unknown>,
      scores: { score: result.output.score },
    });

    await this.councilEventService.completeEvent(started.id, {
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_reviewer,
      label: result.output.passed
        ? 'Media Reviewer QA passed'
        : 'Media Reviewer QA failed',
      completedSteps: params.completedSteps + 1,
      totalSteps: params.totalSteps,
      output: result.output as unknown as Record<string, unknown>,
      scores: { score: result.output.score },
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      startedAt: started.startedAt,
    });

    return result.output;
  }

  resolveMediaType(
    input: CouncilInput,
    mediaTypePreference?: PostMediaType | null,
  ): PostMediaType {
    const templateDef = getTemplateDefinition(input.mediaTemplateId);
    if (templateDef) {
      return templateDef.mediaType;
    }
    return (
      input.mediaType ??
      mediaTypePreference ??
      suggestMediaType(input.postType)
    );
  }
}
