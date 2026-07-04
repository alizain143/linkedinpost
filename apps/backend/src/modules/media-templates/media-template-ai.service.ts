import { Inject, Injectable } from '@nestjs/common';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { parseMediaTemplateLayout } from './layout.validator';
import { MediaTemplateLayout } from './layout.types';
import { TEMPLATE_AUTHOR_V1_SYSTEM } from './prompts/template-author.v1.system';
import { getSystemIdentityCardPreset } from './presets/identity-card.preset';

export interface AiTemplateDraft {
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
}

@Injectable()
export class MediaTemplateAiService {
  constructor(
    private readonly workspacesService: WorkspacesService,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  async draftFromPrompt(
    workspaceId: string,
    userId: string,
    prompt: string,
  ): Promise<AiTemplateDraft> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const completion = await this.modelRouter.text().complete({
      messages: [
        { role: 'system', content: TEMPLATE_AUTHOR_V1_SYSTEM },
        {
          role: 'user',
          content: `Design a media template for this brief:\n${prompt.trim()}`,
        },
      ],
      temperature: 0.4,
    });

    return this.parseDraft(completion.content);
  }

  private parseDraft(content: string): AiTemplateDraft {
    const fallback = getSystemIdentityCardPreset();
    let parsed: unknown;

    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return {
        name: fallback.name,
        description: fallback.description,
        width: fallback.width,
        height: fallback.height,
        layout: fallback.layout,
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        name: fallback.name,
        description: fallback.description,
        width: fallback.width,
        height: fallback.height,
        layout: fallback.layout,
      };
    }

    const obj = parsed as Record<string, unknown>;
    try {
      const layout = parseMediaTemplateLayout(obj.layout ?? obj);
      return {
        name:
          typeof obj.name === 'string' && obj.name.trim()
            ? obj.name.trim()
            : 'AI Template',
        description:
          typeof obj.description === 'string'
            ? obj.description.trim()
            : null,
        width:
          typeof obj.width === 'number' && obj.width > 0
            ? obj.width
            : 1080,
        height:
          typeof obj.height === 'number' && obj.height > 0
            ? obj.height
            : 1080,
        layout,
      };
    } catch {
      return {
        name: fallback.name,
        description: fallback.description,
        width: fallback.width,
        height: fallback.height,
        layout: fallback.layout,
      };
    }
  }
}
