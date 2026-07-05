import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Modality } from '@google/genai';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { GoogleGenAIClientFactory } from '../generation/llm/google-genai.client';
import { parseMediaTemplateLayout } from './layout.validator';
import { MediaTemplateLayout } from './layout.types';
import { TEMPLATE_AUTHOR_V1_SYSTEM } from './prompts/template-author.v1.system';
import { TEMPLATE_AUTHOR_FROM_REFERENCE_V1_SYSTEM } from './prompts/template-author-from-reference.v1.system';
import { normalizeReferenceDraftLayout } from './reference-draft-normalizer';
import { clampLayout } from './layout-bounds.util';
import { getSystemIdentityCardPreset, IDENTITY_CARD_LAYOUT } from './presets/identity-card.preset';
import type { AiTemplateReferenceFileDto } from './dto/ai-template-reference-file.dto';

export interface AiTemplateDraft {
  name: string;
  description: string | null;
  width: number;
  height: number;
  layout: MediaTemplateLayout;
}

export type AiTemplateDraftInput = {
  prompt?: string;
  referenceFile?: AiTemplateReferenceFileDto;
};

const REFERENCE_MAX_BYTES = 6 * 1024 * 1024;
const REFERENCE_VISION_MODEL = 'gemini-2.5-flash';

@Injectable()
export class MediaTemplateAiService {
  private readonly logger = new Logger(MediaTemplateAiService.name);

  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly configService: ConfigService,
    private readonly googleGenAIClientFactory: GoogleGenAIClientFactory,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
  ) {}

  async draftFromInput(
    workspaceId: string,
    userId: string,
    input: AiTemplateDraftInput,
  ): Promise<AiTemplateDraft> {
    await this.workspacesService.assertMember(userId, workspaceId);

    const prompt = input.prompt?.trim() ?? '';
    if (!input.referenceFile && prompt.length < 10) {
      throw new BadRequestException(
        'Upload a reference file, or describe the template in at least 10 characters',
      );
    }

    if (input.referenceFile) {
      return this.draftWithReference(prompt || undefined, input.referenceFile);
    }

    return this.draftFromText(prompt);
  }

  private async draftFromText(prompt: string): Promise<AiTemplateDraft> {
    const completion = await this.modelRouter.text().complete({
      messages: [
        { role: 'system', content: TEMPLATE_AUTHOR_V1_SYSTEM },
        {
          role: 'user',
          content: `Design a media template for this brief:\n${prompt}`,
        },
      ],
      temperature: 0.4,
    });

    return this.parseDraft(completion.content);
  }

  private async draftWithReference(
    prompt: string | undefined,
    reference: AiTemplateReferenceFileDto,
  ): Promise<AiTemplateDraft> {
    const buffer = Buffer.from(reference.data, 'base64');
    if (buffer.length === 0) {
      throw new BadRequestException('Reference file is empty');
    }
    if (buffer.length > REFERENCE_MAX_BYTES) {
      throw new BadRequestException('Reference file exceeds 6 MB');
    }

    if (!this.googleGenAIClientFactory.isConfigured()) {
      throw new BadRequestException(
        'Reference template drafting requires Google Gemini (GEMINI_API_KEY). Configure it and try again.',
      );
    }

    try {
      const client = this.googleGenAIClientFactory.createClient();
      const response = await client.models.generateContent({
        model: REFERENCE_VISION_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: reference.mimeType,
                  data: reference.data,
                },
              },
              {
                text: `${TEMPLATE_AUTHOR_FROM_REFERENCE_V1_SYSTEM}\n\n${this.buildReferenceUserMessage(prompt, reference.fileName)}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.TEXT],
          temperature: 0.1,
        },
      });

      const text =
        response.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('') ?? '';

      if (!text.trim()) {
        throw new Error('Vision model returned empty content');
      }

      return this.parseDraft(text, true);
    } catch (error) {
      this.logger.warn('Reference template draft failed', error);
      throw new BadRequestException(
        'Could not generate a template from the reference. Try a clearer image/PDF or add short notes about the layout.',
      );
    }
  }

  private buildReferenceUserMessage(
    prompt: string | undefined,
    fileName?: string,
  ): string {
    const lines = [
      'Reproduce the attached reference as template layout JSON with maximum fidelity.',
      '',
      'Checklist before you respond:',
      '- Measured every visible region on the 1080×1080 grid',
      '- Sampled hex colors from the reference (not invented palette)',
      '- Matched headline position, alignment, size, and weight',
      '- Traced visual_zone to the exact photo/illustration bounds',
      '- Added a rect for every color block, footer bar, and decorative shape',
      '- Copied static label text verbatim from the reference',
      '- Did not add identity-card chrome unless the reference has it',
    ];

    if (fileName?.trim()) {
      lines.push('', `Reference file: ${fileName.trim()}`);
    }
    if (prompt?.trim()) {
      lines.push('', `Additional notes from the user:\n${prompt.trim()}`);
    }

    lines.push('', 'Return ONLY the JSON object.');
    return lines.join('\n');
  }

  private parseDraft(
    content: string,
    fromReference = false,
  ): AiTemplateDraft {
    const fallback = getSystemIdentityCardPreset();
    let parsed: unknown;

    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      if (fromReference) {
        throw new BadRequestException(
          'The model returned invalid layout JSON. Please try again with the same reference.',
        );
      }
      return {
        name: fallback.name,
        description: fallback.description,
        width: fallback.width,
        height: fallback.height,
        layout: IDENTITY_CARD_LAYOUT,
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      if (fromReference) {
        throw new BadRequestException(
          'The model returned invalid layout JSON. Please try again with the same reference.',
        );
      }
      return {
        name: fallback.name,
        description: fallback.description,
        width: fallback.width,
        height: fallback.height,
        layout: IDENTITY_CARD_LAYOUT,
      };
    }

    const obj = parsed as Record<string, unknown>;
    try {
      const width =
        typeof obj.width === 'number' && obj.width > 0 ? obj.width : 1080;
      const height =
        typeof obj.height === 'number' && obj.height > 0 ? obj.height : 1080;
      let layout = parseMediaTemplateLayout(obj.layout ?? obj);
      layout = fromReference
        ? normalizeReferenceDraftLayout(layout, width, height)
        : clampLayout(layout, width, height);
      return {
        name:
          typeof obj.name === 'string' && obj.name.trim()
            ? obj.name.trim()
            : 'AI Template',
        description:
          typeof obj.description === 'string'
            ? obj.description.trim()
            : null,
        width,
        height,
        layout,
      };
    } catch (error) {
      if (fromReference) {
        throw new BadRequestException(
          error instanceof Error
            ? `Reference layout could not be parsed: ${error.message}`
            : 'Reference layout could not be parsed. Please try again.',
        );
      }
      return {
        name: fallback.name,
        description: fallback.description,
        width: fallback.width,
        height: fallback.height,
        layout: IDENTITY_CARD_LAYOUT,
      };
    }
  }
}
