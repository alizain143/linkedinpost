import { Injectable } from '@nestjs/common';
import { CouncilAgentRole, MediaFormat, MediaMode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContextAssembler } from '../generation/context/context-assembler';
import { CouncilInput, CouncilPriorStep } from '../generation/generation.types';
import { FreestyleCarouselRenderService } from '../media-generation/freestyle-carousel-render.service';
import { MediaRenderService } from '../media-generation/media-render.service';
import {
  isCarouselTemplate,
  isCarouselLayout,
} from '../media-templates/layout.types';
import { MediaTemplateResolveService } from '../media-templates/media-template-resolve.service';
import { TemplateCarouselRenderService } from '../media-templates/template-carousel-render.service';
import { TemplateMediaRenderService } from '../media-templates/template-media-render.service';
import { TemplateProfileResolverService } from '../media-templates/template-profile-resolver.service';
import { CouncilAgentService } from './council-agent.service';
import { CouncilEventService } from './council-event.service';
import { MediaCreatorOutput } from './parsers/media-creator-output.parser';
import { MediaVisionReviewerService } from './media-vision-reviewer.service';

export interface CarouselSlideDraft {
  imageBuffer: Buffer;
  mimeType: string;
  altText: string;
  sortOrder: number;
  mediaType: 'generated' | 'template';
}

export interface CouncilMediaDraft {
  spec: MediaCreatorOutput;
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
  eventId: string;
  mediaType: 'generated' | 'template';
  templateId?: string;
  isCarousel?: boolean;
  slides?: CarouselSlideDraft[];
}

@Injectable()
export class CouncilMediaPhaseService {
  constructor(
    private readonly councilAgentService: CouncilAgentService,
    private readonly councilEventService: CouncilEventService,
    private readonly mediaRenderService: MediaRenderService,
    private readonly contextAssembler: ContextAssembler,
    private readonly mediaVisionReviewer: MediaVisionReviewerService,
    private readonly mediaTemplateResolve: MediaTemplateResolveService,
    private readonly templateMediaRender: TemplateMediaRenderService,
    private readonly templateCarouselRender: TemplateCarouselRenderService,
    private readonly freestyleCarouselRender: FreestyleCarouselRenderService,
    private readonly templateProfileResolver: TemplateProfileResolverService,
    private readonly prisma: PrismaService,
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
    if (params.input.mediaFormat === MediaFormat.carousel) {
      const mode = await this.mediaTemplateResolve.resolveMode({
        workspaceId: params.input.workspaceId,
        contentProfileId: params.input.contentProfileId,
        mediaMode: params.input.mediaMode,
        mediaTemplateId: params.input.mediaTemplateId,
      });

      if (mode === MediaMode.template && params.input.mediaTemplateId) {
        const template = await this.mediaTemplateResolve.resolveTemplate({
          workspaceId: params.input.workspaceId,
          contentProfileId: params.input.contentProfileId,
          mediaMode: MediaMode.template,
          mediaTemplateId: params.input.mediaTemplateId,
        });

        if (isCarouselTemplate(template) || isCarouselLayout(template.layout)) {
          return this.executeTemplateCarouselCreator(params, template);
        }
      }

      return this.executeFreestyleCarouselCreator(params);
    }

    const mode = await this.mediaTemplateResolve.resolveMode({
      workspaceId: params.input.workspaceId,
      contentProfileId: params.input.contentProfileId,
      mediaMode: params.input.mediaMode,
      mediaTemplateId: params.input.mediaTemplateId,
    });

    if (mode === MediaMode.template) {
      return this.executeTemplateMediaCreator(params);
    }

    return this.executeFreestyleMediaCreator(params);
  }

  private async executeTemplateMediaCreator(params: {
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
      label: 'Media Creator filling template slots',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const template = await this.mediaTemplateResolve.resolveTemplate({
      workspaceId: params.input.workspaceId,
      contentProfileId: params.input.contentProfileId,
      mediaMode: MediaMode.template,
      mediaTemplateId: params.input.mediaTemplateId,
    });

    const context = await this.contextAssembler.assemble(params.input);
    const user = await this.prisma.user.findUnique({
      where: { id: params.input.userId },
      select: {
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        email: true,
        timezone: true,
        plan: true,
        id: true,
      },
    });

    const resolvedProfile =
      await this.templateProfileResolver.resolveForWorkspace(
        params.input.workspaceId,
        params.input.userId,
      );

    const rendered = await this.templateMediaRender.render({
      template,
      input: params.input,
      priorSteps: params.priorSteps,
      profile: context.contentProfile,
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            timezone: user.timezone,
            plan: user.plan,
          }
        : undefined,
      resolvedProfile,
    });

    const spec: MediaCreatorOutput = {
      altText: rendered.altText,
      width: rendered.width,
      height: rendered.height,
      imagePrompt: `template:${rendered.templateId}`,
      styleNotes: 'template-render',
    };

    const eventOutput = {
      ...spec,
      ...rendered.slots,
      templateId: rendered.templateId,
      generated: true,
      mediaMode: MediaMode.template,
      imageModel: rendered.imageModel,
    };

    this.updatePriorSteps(params, eventOutput);

    await this.councilEventService.completeEvent(started.id, {
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      label: 'Media Creator rendered template',
      completedSteps: params.completedSteps + 1,
      totalSteps: params.totalSteps,
      output: eventOutput,
      model: rendered.imageModel,
      startedAt: started.startedAt,
    });

    return {
      spec,
      imageBuffer: rendered.imageBuffer,
      mimeType: rendered.mimeType,
      imageModel: rendered.imageModel,
      eventId: started.id,
      mediaType: 'template',
      templateId: rendered.templateId,
    };
  }

  private async executeFreestyleMediaCreator(params: {
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
      mediaMode: MediaMode.freestyle,
      imageModel: rendered.imageModel,
    };

    this.updatePriorSteps(params, eventOutput);

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
      mediaType: 'generated',
    };
  }

  private async executeTemplateCarouselCreator(
    params: {
      generationJobId: string;
      input: CouncilInput;
      priorSteps: CouncilPriorStep[];
      attempt: number;
      stepOrder: number;
      completedSteps: number;
      totalSteps: number;
    },
    template: Awaited<
      ReturnType<MediaTemplateResolveService['resolveTemplate']>
    >,
  ): Promise<CouncilMediaDraft> {
    const started = await this.councilEventService.startEvent({
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      stepOrder: params.stepOrder,
      revisionAttempt: params.attempt,
      label: 'Media Creator rendering carousel template',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const context = await this.contextAssembler.assemble(params.input);
    const user = await this.prisma.user.findUnique({
      where: { id: params.input.userId },
      select: {
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        email: true,
        timezone: true,
        plan: true,
        id: true,
      },
    });

    const resolvedProfile =
      await this.templateProfileResolver.resolveForWorkspace(
        params.input.workspaceId,
        params.input.userId,
      );

    const rendered = await this.templateCarouselRender.render({
      template,
      input: params.input,
      priorSteps: params.priorSteps,
      profile: context.contentProfile,
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            timezone: user.timezone,
            plan: user.plan,
          }
        : undefined,
      resolvedProfile,
    });

    const slides: CarouselSlideDraft[] = rendered.slides.map((slide) => ({
      imageBuffer: slide.imageBuffer,
      mimeType: slide.mimeType,
      altText: slide.altText,
      sortOrder: slide.sortOrder,
      mediaType: slide.mediaType,
    }));

    const firstSlide = slides[0];
    const spec: MediaCreatorOutput = {
      altText: rendered.altText,
      width: rendered.width,
      height: rendered.height,
      imagePrompt: `carousel-template:${rendered.templateId}`,
      styleNotes: 'carousel-template-render',
    };

    const eventOutput = {
      ...spec,
      templateId: rendered.templateId,
      generated: true,
      mediaMode: MediaMode.template,
      mediaFormat: MediaFormat.carousel,
      slideCount: slides.length,
      imageModel: rendered.imageModel,
    };

    this.updatePriorSteps(params, eventOutput);

    await this.councilEventService.completeEvent(started.id, {
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      label: `Media Creator rendered ${slides.length}-slide carousel`,
      completedSteps: params.completedSteps + 1,
      totalSteps: params.totalSteps,
      output: eventOutput,
      model: rendered.imageModel,
      startedAt: started.startedAt,
    });

    return {
      spec,
      imageBuffer: firstSlide.imageBuffer,
      mimeType: firstSlide.mimeType,
      imageModel: rendered.imageModel,
      eventId: started.id,
      mediaType: 'template',
      templateId: rendered.templateId,
      isCarousel: true,
      slides,
    };
  }

  private async executeFreestyleCarouselCreator(params: {
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
      label: 'Media Creator generating freestyle carousel',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const context = await this.contextAssembler.assemble(params.input);
    const rendered = await this.freestyleCarouselRender.render({
      input: params.input,
      priorSteps: params.priorSteps,
      profile: context.contentProfile,
    });

    const slides: CarouselSlideDraft[] = rendered.slides.map((slide) => ({
      imageBuffer: slide.imageBuffer,
      mimeType: slide.mimeType,
      altText: slide.altText,
      sortOrder: slide.sortOrder,
      mediaType: slide.mediaType,
    }));

    const firstSlide = slides[0];
    const spec: MediaCreatorOutput = {
      altText: rendered.altText,
      width: 1080,
      height: 1080,
      imagePrompt: 'freestyle-carousel',
      styleNotes: rendered.plan.sharedStyleNotes,
    };

    const eventOutput = {
      ...spec,
      generated: true,
      mediaMode: MediaMode.freestyle,
      mediaFormat: MediaFormat.carousel,
      slideCount: slides.length,
      imageModel: rendered.imageModel,
    };

    this.updatePriorSteps(params, eventOutput);

    await this.councilEventService.completeEvent(started.id, {
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_creator,
      label: `Media Creator generated ${slides.length}-slide freestyle carousel`,
      completedSteps: params.completedSteps + 1,
      totalSteps: params.totalSteps,
      output: eventOutput,
      model: rendered.imageModel,
      startedAt: started.startedAt,
    });

    return {
      spec,
      imageBuffer: firstSlide.imageBuffer,
      mimeType: firstSlide.mimeType,
      imageModel: rendered.imageModel,
      eventId: started.id,
      mediaType: 'generated',
      isCarousel: true,
      slides,
    };
  }

  private updatePriorSteps(
    params: {
      priorSteps: CouncilPriorStep[];
      attempt: number;
    },
    eventOutput: Record<string, unknown>,
  ) {
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
    slides?: CarouselSlideDraft[];
  }) {
    const started = await this.councilEventService.startEvent({
      generationJobId: params.generationJobId,
      agentRole: CouncilAgentRole.media_reviewer,
      stepOrder: params.stepOrder,
      revisionAttempt: 1,
      label: params.slides && params.slides.length > 1
        ? `Media Reviewer QA (${params.slides.length} slides)`
        : 'Media Reviewer QA',
      completedSteps: params.completedSteps,
      totalSteps: params.totalSteps,
    });

    const result =
      params.slides && params.slides.length > 1
        ? await this.mediaVisionReviewer.reviewCarousel(
            params.input,
            params.priorSteps,
            params.slides,
          )
        : params.imageBuffer && params.mimeType
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
