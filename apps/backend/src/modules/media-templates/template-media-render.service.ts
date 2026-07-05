import { Inject, Injectable, Logger } from '@nestjs/common';
import { CouncilPriorStep } from '../generation/generation.types';
import type {
  CouncilInput,
  GenerationContentProfileContext,
  GenerationUserContext,
} from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import {
  MediaTemplateLayout,
  ResolvedMediaTemplate,
  TemplateSlotContent,
  TemplateVisualZoneElement,
} from './layout.types';
import { TEMPLATE_SLOT_FILL_V1_SYSTEM } from './prompts/template-slot-fill.v1.system';
import { TemplatePngRenderer } from './template-png.renderer';
import { TemplateSlotFillParser } from './template-slot-fill.parser';
import { ResolvedTemplateProfile } from './template-profile-resolver';

export interface TemplateMediaRenderResult {
  imageBuffer: Buffer;
  mimeType: string;
  imageModel: string;
  slots: TemplateSlotContent;
  templateId: string;
  altText: string;
  width: number;
  height: number;
}

@Injectable()
export class TemplateMediaRenderService {
  private readonly logger = new Logger(TemplateMediaRenderService.name);

  constructor(
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly slotFillParser: TemplateSlotFillParser,
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
  }): Promise<TemplateMediaRenderResult> {
    const visualZones = this.findVisualZones(params.template.layout);
    const slots = await this.fillSlots(params, visualZones.length > 0);

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

    let visualZoneImages: Record<string, string> | undefined;
    let imageModel = 'template-svg-resvg';

    if (visualZones.length > 0) {
      const generated = await this.generateVisualZoneImages({
        zones: visualZones,
        slots,
        input: params.input,
        profile: params.profile,
      });
      visualZoneImages = generated.images;
      if (generated.imageModel) {
        imageModel = `template-svg-resvg+${generated.imageModel}`;
      }
    }

    const imageBuffer = await this.pngRenderer.renderPng(
      params.template.layout,
      params.template.width,
      params.template.height,
      {
        profileName,
        roleTitle,
        currentCompany,
        industry,
        avatarUrl,
        brandPrimary:
          params.resolvedProfile?.brandPrimary ?? params.profile?.brandPrimary,
        brandAccent:
          params.resolvedProfile?.brandAccent ?? params.profile?.brandAccent,
        slots,
        visualZoneImages,
      },
    );

    return {
      imageBuffer,
      mimeType: 'image/png',
      imageModel,
      slots,
      templateId: params.template.id,
      altText: slots.altText,
      width: params.template.width,
      height: params.template.height,
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
      'Avoid tiny unreadable text; prefer icons, diagrams, or illustration.',
    );

    return parts.filter(Boolean).join('\n');
  }

  private async fillSlots(
    params: {
      input: CouncilInput;
      priorSteps: CouncilPriorStep[];
      profile?: GenerationContentProfileContext;
    },
    hasVisualZone: boolean,
  ): Promise<TemplateSlotContent> {
    const editor =
      params.priorSteps.find((s) => s.agentRole === 'editor')?.output ??
      params.priorSteps.find((s) => s.agentRole === 'writer')?.output ??
      {};

    const hook = String(editor.hook ?? params.input.topic ?? '');
    const body = String(editor.body ?? '');
    const cta = String(editor.cta ?? '');

    const userParts = [
      `Post copy:`,
      `hook: ${hook}`,
      `body: ${body}`,
      `cta: ${cta}`,
      ``,
      `Profile:`,
      `name: ${params.profile?.name ?? ''}`,
      `roleTitle: ${params.profile?.roleTitle ?? ''}`,
      `brandPrimary: ${params.profile?.brandPrimary ?? ''}`,
      `brandAccent: ${params.profile?.brandAccent ?? ''}`,
      ``,
      hasVisualZone
        ? 'This template HAS a visual_zone. You MUST include visualPrompt for the AI graphic inset.'
        : 'This template has no visual_zone. Omit visualPrompt.',
    ];

    if (params.input.mediaCustomPrompt?.trim()) {
      userParts.push(
        ``,
        `User media direction: ${params.input.mediaCustomPrompt.trim()}`,
      );
    }

    userParts.push(``, `Fill the template content slots as JSON.`);

    const completion = await this.modelRouter.text().complete({
      messages: [
        { role: 'system', content: TEMPLATE_SLOT_FILL_V1_SYSTEM },
        { role: 'user', content: userParts.join('\n') },
      ],
      temperature: 0.5,
    });

    try {
      return this.slotFillParser.parse(completion.content);
    } catch {
      const fallbackHeadline = hook.slice(0, 120) || 'Key insight';
      return {
        headline: fallbackHeadline,
        subhead: body.slice(0, 160) || undefined,
        visualPrompt: hasVisualZone
          ? `Clean professional illustration representing: ${fallbackHeadline}. Minimal text, conceptual, LinkedIn feed quality.`
          : undefined,
        altText: fallbackHeadline,
      };
    }
  }
}
