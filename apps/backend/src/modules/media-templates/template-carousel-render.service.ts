import { Inject, Injectable, Logger } from '@nestjs/common';
import { CouncilPriorStep } from '../generation/generation.types';
import type {
  CouncilInput,
  GenerationContentProfileContext,
  GenerationUserContext,
} from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { inferSlideCountFromBody } from '../media-generation/media-credit.util';
import { CarouselSlotFillParser } from './carousel-slot-fill.parser';
import { mapWithConcurrency } from './carousel-render.util';
import {
  CarouselMediaTemplateLayout,
  CarouselPageRole,
  CarouselSlideSlotContent,
  CarouselSlotFillResult,
  getCarouselPageLayout,
  isCarouselLayout,
  MediaTemplateLayout,
  ResolvedMediaTemplate,
  TemplateSlotContent,
  TemplateVisualZoneElement,
} from './layout.types';
import { CAROUSEL_SLOT_FILL_V1_SYSTEM } from './prompts/carousel-slot-fill.v1.system';
import { TemplatePngRenderer } from './template-png.renderer';
import { ResolvedTemplateProfile } from './template-profile-resolver';

export interface CarouselRenderedSlide {
  imageBuffer: Buffer;
  mimeType: string;
  altText: string;
  sortOrder: number;
  mediaType: 'template';
  role: CarouselPageRole;
}

export interface TemplateCarouselRenderResult {
  slides: CarouselRenderedSlide[];
  slotFill: CarouselSlotFillResult;
  templateId: string;
  imageModel: string;
  width: number;
  height: number;
  altText: string;
}

@Injectable()
export class TemplateCarouselRenderService {
  private readonly logger = new Logger(TemplateCarouselRenderService.name);

  constructor(
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly carouselSlotFillParser: CarouselSlotFillParser,
    private readonly pngRenderer: TemplatePngRenderer,
  ) {}

  async render(params: {
    template: ResolvedMediaTemplate;
    input: CouncilInput;
    priorSteps: CouncilPriorStep[];
    profile?: GenerationContentProfileContext;
    user?: GenerationUserContext;
    resolvedProfile?: ResolvedTemplateProfile;
    avatarUrl?: string | null;
  }): Promise<TemplateCarouselRenderResult> {
    if (!isCarouselLayout(params.template.layout)) {
      throw new Error('Template is not a carousel layout');
    }

    const carouselLayout = params.template.layout;
    const slotFill = await this.fillCarouselSlots(params, carouselLayout);

    const profileName =
      params.resolvedProfile?.profileName ??
      ([params.user?.firstName, params.user?.lastName]
        .filter(Boolean)
        .join(' ') ||
        params.profile?.name ||
        'Creator');

    const roleTitle =
      params.resolvedProfile?.roleTitle ?? params.profile?.roleTitle ?? '';
    const currentCompany = params.resolvedProfile?.currentCompany ?? '';
    const industry =
      params.resolvedProfile?.industry ?? params.profile?.industry ?? '';
    const avatarUrl =
      params.resolvedProfile?.avatarUrl ?? params.avatarUrl ?? null;

    let imageModel = 'template-svg-resvg';

    const renderedSlides = await mapWithConcurrency(
      slotFill.slides,
      3,
      async (slideSlot, index) => {
        const pageLayout = getCarouselPageLayout(carouselLayout, slideSlot.role);
        const visualZones = this.findVisualZones(pageLayout);

        let visualZoneImages: Record<string, string> | undefined;
        if (visualZones.length > 0) {
          const generated = await this.generateVisualZoneImages({
            zones: visualZones,
            slots: slideSlot,
            input: params.input,
            profile: params.profile,
          });
          visualZoneImages = generated.images;
          if (generated.imageModel) {
            imageModel = `template-svg-resvg+${generated.imageModel}`;
          }
        }

        const imageBuffer = await this.pngRenderer.renderPng(
          pageLayout,
          params.template.width,
          params.template.height,
          {
            profileName,
            roleTitle,
            currentCompany,
            industry,
            avatarUrl,
            brandPrimary:
              params.resolvedProfile?.brandPrimary ??
              params.profile?.brandPrimary,
            brandAccent:
              params.resolvedProfile?.brandAccent ??
              params.profile?.brandAccent,
            slots: slideSlot,
            visualZoneImages,
          },
        );

        return {
          imageBuffer,
          mimeType: 'image/png',
          altText: slideSlot.altText,
          sortOrder: index,
          mediaType: 'template' as const,
          role: slideSlot.role,
        };
      },
    );

    return {
      slides: renderedSlides,
      slotFill,
      templateId: params.template.id,
      imageModel,
      width: params.template.width,
      height: params.template.height,
      altText: slotFill.slides[0]?.altText ?? 'Carousel',
    };
  }

  private findVisualZones(
    layout: MediaTemplateLayout,
  ): TemplateVisualZoneElement[] {
    return layout.elements.filter(
      (el): el is TemplateVisualZoneElement => el.type === 'visual_zone',
    );
  }

  private async generateVisualZoneImages(params: {
    zones: TemplateVisualZoneElement[];
    slots: TemplateSlotContent;
    input: CouncilInput;
    profile?: GenerationContentProfileContext;
  }): Promise<{ images: Record<string, string>; imageModel?: string }> {
    const images: Record<string, string> = {};
    let imageModel: string | undefined;
    const basePrompt = this.buildVisualPrompt(params);

    for (const zone of params.zones) {
      try {
        const result = await this.modelRouter.image().generate({
          prompt: basePrompt,
          width: Math.max(256, Math.round(zone.w)),
          height: Math.max(256, Math.round(zone.h)),
          styleNotes:
            'Inset graphic only for a LinkedIn template card. No logos, no watermarks, little or no text.',
        });
        imageModel = result.model;
        const mime = result.mimeType || 'image/png';
        images[zone.id] =
          `data:${mime};base64,${result.imageBuffer.toString('base64')}`;
      } catch (err) {
        this.logger.error(
          `Visual zone image generation failed for ${zone.id}`,
          err,
        );
      }
    }

    return { images, imageModel };
  }

  private buildVisualPrompt(params: {
    slots: TemplateSlotContent;
    input: CouncilInput;
    profile?: GenerationContentProfileContext;
  }): string {
    const parts: string[] = [];

    if (params.slots.visualPrompt?.trim()) {
      parts.push(params.slots.visualPrompt.trim());
    } else {
      parts.push(
        `Conceptual illustration for: ${params.slots.headline}`,
        params.slots.subhead ? `Context: ${params.slots.subhead}` : '',
      );
    }

    const brandPrimary = params.profile?.brandPrimary?.trim();
    const brandAccent = params.profile?.brandAccent?.trim();
    if (brandPrimary || brandAccent) {
      const colors = [
        brandPrimary ? `primary ${brandPrimary}` : null,
        brandAccent ? `accent ${brandAccent}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      parts.push(`Brand color theme: ${colors}.`);
    }

    const custom = params.input.mediaCustomPrompt?.trim();
    if (custom) {
      parts.push(`User direction: ${custom}`);
    }

    parts.push(
      'Generate only the graphic inset: clean, professional, LinkedIn-ready.',
      'Do not render UI chrome, profile photos, names, or footer text.',
    );

    return parts.filter(Boolean).join('\n');
  }

  private async fillCarouselSlots(
    params: {
      input: CouncilInput;
      priorSteps: CouncilPriorStep[];
      profile?: GenerationContentProfileContext;
    },
    layout: CarouselMediaTemplateLayout,
  ): Promise<CarouselSlotFillResult> {
    const editor =
      params.priorSteps.find((s) => s.agentRole === 'editor')?.output ??
      params.priorSteps.find((s) => s.agentRole === 'writer')?.output ??
      {};

    const hook = String(editor.hook ?? params.input.topic ?? '');
    const body = String(editor.body ?? '');
    const cta = String(editor.cta ?? '');

    const targetSlides =
      params.input.carouselSlideCount ??
      inferSlideCountFromBody(body);

    const userParts = [
      `Post copy:`,
      `hook: ${hook}`,
      `body: ${body}`,
      `cta: ${cta}`,
      ``,
      `Target total slides: ${targetSlides}`,
      ``,
      `Profile:`,
      `name: ${params.profile?.name ?? ''}`,
      `roleTitle: ${params.profile?.roleTitle ?? ''}`,
      ``,
      'Every slide page has a visual_zone. Include visualPrompt for each slide.',
    ];

    if (params.input.mediaCustomPrompt?.trim()) {
      userParts.push(
        ``,
        `User media direction: ${params.input.mediaCustomPrompt.trim()}`,
      );
    }

    userParts.push(``, `Fill the carousel slots as JSON.`);

    const completion = await this.modelRouter.text().complete({
      messages: [
        { role: 'system', content: CAROUSEL_SLOT_FILL_V1_SYSTEM },
        { role: 'user', content: userParts.join('\n') },
      ],
      temperature: 0.5,
    });

    try {
      const parsed = this.carouselSlotFillParser.parse(completion.content);
      if (params.input.carouselSlideCount != null) {
        return this.carouselSlotFillParser.parse(
          JSON.stringify({
            totalSlides: params.input.carouselSlideCount,
            slides: parsed.slides.slice(0, params.input.carouselSlideCount),
          }),
        );
      }
      return parsed;
    } catch {
      return this.buildFallbackSlots(hook, body, targetSlides, layout);
    }
  }

  private buildFallbackSlots(
    hook: string,
    body: string,
    targetSlides: number,
    layout: CarouselMediaTemplateLayout,
  ): CarouselSlotFillResult {
    const slides: CarouselSlideSlotContent[] = [];
    const headline = hook.slice(0, 120) || 'Key insight';

    slides.push({
      role: 'first',
      headline,
      subhead: body.slice(0, 160) || undefined,
      visualPrompt: `Cover graphic for: ${headline}`,
      altText: headline,
    });

    const middleCount = Math.max(1, targetSlides - 2);
    const bodyLines = body
      .split('\n')
      .map((line) => line.replace(/^(\d+[.)]|[-•*])\s+/, '').trim())
      .filter(Boolean);

    for (let i = 0; i < middleCount; i += 1) {
      const point = bodyLines[i] ?? `Point ${i + 1}`;
      slides.push({
        role: 'middle',
        headline: point.slice(0, 80),
        subhead: undefined,
        visualPrompt: `Illustration for: ${point.slice(0, 80)}`,
        altText: point.slice(0, 120),
      });
    }

    slides.push({
      role: 'last',
      headline: 'Key takeaway',
      subhead: 'Follow for more insights',
      visualPrompt: 'Summary CTA graphic, professional LinkedIn style',
      altText: 'Carousel closing slide',
    });

    return this.carouselSlotFillParser.parse(
      JSON.stringify({ totalSlides: targetSlides, slides }),
    );
  }
}
