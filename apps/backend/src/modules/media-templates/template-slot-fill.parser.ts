import { Injectable } from '@nestjs/common';
import { generationParseError } from '../generation/generation.errors';
import { TemplateSlotContent } from './layout.types';

@Injectable()
export class TemplateSlotFillParser {
  parse(content: string): TemplateSlotContent {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Template slot fill output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Template slot fill output must be an object');
    }

    const obj = parsed as Record<string, unknown>;
    const headline =
      typeof obj.headline === 'string' ? obj.headline.trim() : '';
    if (!headline) {
      throw generationParseError('headline is required');
    }

    return {
      headline,
      headlineHighlight:
        typeof obj.headlineHighlight === 'string'
          ? obj.headlineHighlight.trim()
          : undefined,
      subhead:
        typeof obj.subhead === 'string' ? obj.subhead.trim() : undefined,
      visualPrompt:
        typeof obj.visualPrompt === 'string'
          ? obj.visualPrompt.trim()
          : undefined,
      altText:
        typeof obj.altText === 'string' && obj.altText.trim()
          ? obj.altText.trim()
          : headline,
    };
  }
}
