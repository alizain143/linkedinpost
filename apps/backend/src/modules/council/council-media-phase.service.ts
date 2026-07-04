import { Injectable } from '@nestjs/common';
import { CouncilAgentRole } from '@prisma/client';
import { ContextAssembler } from '../generation/context/context-assembler';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { MediaRenderService } from '../media-generation/media-render.service';
import { CouncilAgentService } from './council-agent.service';
import { CouncilEventService } from './council-event.service';
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
    private readonly councilAgentService: CouncilAgentService,
    private readonly councilEventService: CouncilEventService,
    private readonly mediaRenderService: MediaRenderService,
    private readonly contextAssembler: ContextAssembler,
    private readonly mediaVisionReviewer: MediaVisionReviewerService,
  ) {}

  async executeMediaCreator(params: {
    generationJobId: string;
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    attempt: number;
    stepOrder: number;
    completedSteps: number;
    totalSteps: number;
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
}
