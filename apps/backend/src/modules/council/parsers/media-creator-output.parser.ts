import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';

export interface MediaCreatorOutput {
  mediaType: string;
  placeholderUrl: string | null;
  altText: string;
  status: string;
}

@Injectable()
export class MediaCreatorOutputParser {
  parse(content: string): MediaCreatorOutput {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Media creator output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Media creator output must be an object');
    }

    const obj = parsed as Record<string, unknown>;

    return {
      mediaType: String(obj.mediaType ?? 'quote_card'),
      placeholderUrl:
        obj.placeholderUrl === null || typeof obj.placeholderUrl === 'string'
          ? (obj.placeholderUrl as string | null)
          : null,
      altText: String(obj.altText ?? ''),
      status: String(obj.status ?? 'stub_pending_phase5'),
    };
  }
}
