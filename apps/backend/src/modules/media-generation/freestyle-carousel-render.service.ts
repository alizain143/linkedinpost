import { Inject, Injectable, Logger } from '@nestjs/common';
import { CouncilPriorStep } from '../generation/generation.types';
import type {
  CouncilInput,
  GenerationContentProfileContext,
} from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { mapWithConcurrency } from '../media-templates/carousel-render.util';
import { CarouselPageRole } from '../media-templates/layout.types';
import {
  FreestyleCarouselPlan,
  FreestyleCarouselPlanParser,
} from './freestyle-carousel-plan.parser';
import { inferSlideCountFromBody } from './media-credit.util';
import { MediaRenderService } from './media-render.service';
import { FREESTYLE_CAROUSEL_PLAN_V1_SYSTEM } from './prompts/freestyle-carousel-plan.v1.system';

export interface FreestyleCarouselRenderedSlide {
  imageBuffer: Buffer;
  mimeType: string;
  altText: string;
  sortOrder: number;
  mediaType: 'generated';
  role: CarouselPageRole;
}

export interface FreestyleCarouselRenderResult {
  slides: FreestyleCarouselRenderedSlide[];
  plan: FreestyleCarouselPlan;
  imageModel: string;
  altText: string;
}

@Injectable()
export class FreestyleCarouselRenderService {
  private readonly logger = new Logger(FreestyleCarouselRenderService.name);

  constructor(
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly planParser: FreestyleCarouselPlanParser,
    private readonly mediaRenderService: MediaRenderService,
  ) {}

  async render(params: {
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    profile?: GenerationContentProfileContext;
  }): Promise<FreestyleCarouselRenderResult> {
    const plan = await this.buildPlan(params);

    let imageModel = 'image-model';

    const slides = await mapWithConcurrency(plan.slides, 3, async (slide, index) => {
      const promptParts = [
        plan.sharedStyleNotes,
        slide.imagePrompt,
        params.input.mediaCustomPrompt?.trim()
          ? `User direction: ${params.input.mediaCustomPrompt.trim()}`
          : '',
        'Full-bleed 1080x1080 LinkedIn carousel slide. Professional feed quality.',
      ].filter(Boolean);

      const brandPrimary = params.profile?.brandPrimary?.trim();
      const brandAccent = params.profile?.brandAccent?.trim();
      if (brandPrimary || brandAccent) {
        promptParts.unshift(
          `Brand colors: ${[brandPrimary, brandAccent].filter(Boolean).join(', ')}`,
        );
      }

      try {
        const result = await this.modelRouter.image().generate({
          prompt: promptParts.join('\n'),
          width: 1080,
          height: 1080,
          styleNotes: plan.sharedStyleNotes,
        });
        imageModel = result.model;

        return {
          imageBuffer: result.imageBuffer,
          mimeType: result.mimeType || 'image/png',
          altText: slide.altText,
          sortOrder: index,
          mediaType: 'generated' as const,
          role: slide.role,
        };
      } catch (err) {
        this.logger.error(`Freestyle carousel slide ${index} failed`, err);
        const fallback = await this.mediaRenderService.renderMedia(
          {
            altText: slide.altText,
            width: 1080,
            height: 1080,
            imagePrompt: slide.imagePrompt,
            styleNotes: plan.sharedStyleNotes,
          },
          params.input,
          params.profile,
        );
        imageModel = fallback.imageModel;

        return {
          imageBuffer: fallback.imageBuffer,
          mimeType: fallback.mimeType,
          altText: slide.altText,
          sortOrder: index,
          mediaType: 'generated' as const,
          role: slide.role,
        };
      }
    });

    return {
      slides,
      plan,
      imageModel,
      altText: plan.slides[0]?.altText ?? 'Carousel',
    };
  }

  private async buildPlan(params: {
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    profile?: GenerationContentProfileContext;
  }): Promise<FreestyleCarouselPlan> {
    const editor =
      params.priorSteps.find((s) => s.agentRole === 'editor')?.output ??
      params.priorSteps.find((s) => s.agentRole === 'writer')?.output ??
      {};

    const hook = String(editor.hook ?? params.input.topic ?? '');
    const body = String(editor.body ?? '');
    const cta = String(editor.cta ?? '');

    const targetSlides =
      params.input.carouselSlideCount ?? inferSlideCountFromBody(body);

    const userParts = [
      `Post copy:`,
      `hook: ${hook}`,
      `body: ${body}`,
      `cta: ${cta}`,
      ``,
      `Target total slides: ${targetSlides}`,
    ];

    if (params.input.mediaCustomPrompt?.trim()) {
      userParts.push(
        ``,
        `User media direction: ${params.input.mediaCustomPrompt.trim()}`,
      );
    }

    userParts.push(``, `Plan the freestyle carousel as JSON.`);

    const completion = await this.modelRouter.text().complete({
      messages: [
        { role: 'system', content: FREESTYLE_CAROUSEL_PLAN_V1_SYSTEM },
        { role: 'user', content: userParts.join('\n') },
      ],
      temperature: 0.5,
    });

    try {
      const parsed = this.planParser.parse(completion.content);
      if (params.input.carouselSlideCount != null) {
        return this.planParser.parse(
          JSON.stringify({
            totalSlides: params.input.carouselSlideCount,
            sharedStyleNotes: parsed.sharedStyleNotes,
            slides: parsed.slides.slice(0, params.input.carouselSlideCount),
          }),
        );
      }
      return parsed;
    } catch {
      return this.planParser.parse(
        JSON.stringify({
          totalSlides: targetSlides,
          sharedStyleNotes: 'Clean professional LinkedIn carousel',
          slides: [
            {
              role: 'first',
              imagePrompt: `Cover slide for: ${hook || 'Key insight'}. Bold hook text, minimal design.`,
              altText: hook || 'Carousel cover',
            },
            {
              role: 'last',
              imagePrompt: `CTA slide summarizing: ${hook}. Follow for more.`,
              altText: 'Carousel CTA slide',
            },
          ],
        }),
      );
    }
  }
}
