import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';
import {
  POST_MEDIA_DEFAULT_HEIGHT,
  POST_MEDIA_DEFAULT_WIDTH,
} from '../../../common/constants/media.constants';

export interface MediaCreatorOutput {
  mediaType: 'quote_card';
  altText: string;
  imagePrompt: string;
  width: number;
  height: number;
  headlineText: string;
  styleNotes?: string;
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
    const imagePrompt = String(obj.imagePrompt ?? '').trim();

    if (!imagePrompt) {
      throw generationParseError('Media creator output requires imagePrompt');
    }

    const headlineText = String(obj.headlineText ?? '').trim();
    const mediaType = String(obj.mediaType ?? 'quote_card');

    if (mediaType !== 'quote_card') {
      throw generationParseError('Media creator only supports quote_card in v1');
    }

    return {
      mediaType: 'quote_card',
      altText: String(obj.altText ?? headlineText ?? 'Quote card'),
      imagePrompt,
      width:
        typeof obj.width === 'number' && obj.width > 0
          ? obj.width
          : POST_MEDIA_DEFAULT_WIDTH,
      height:
        typeof obj.height === 'number' && obj.height > 0
          ? obj.height
          : POST_MEDIA_DEFAULT_HEIGHT,
      headlineText,
      styleNotes:
        typeof obj.styleNotes === 'string' ? obj.styleNotes : undefined,
    };
  }
}
