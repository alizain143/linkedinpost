import { Injectable } from '@nestjs/common';
import { generationParseError } from '../../generation/generation.errors';
import {
  POST_MEDIA_DEFAULT_HEIGHT,
  POST_MEDIA_DEFAULT_WIDTH,
} from '../../../common/constants/media.constants';

export interface MediaCreatorOutput {
  altText: string;
  width: number;
  height: number;
  imagePrompt: string;
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
    const imagePrompt =
      typeof obj.imagePrompt === 'string' ? obj.imagePrompt.trim() : '';
    if (!imagePrompt) {
      throw generationParseError('imagePrompt is required');
    }

    const altText = String(obj.altText ?? 'LinkedIn post media').trim();
    const width =
      typeof obj.width === 'number' && obj.width > 0
        ? obj.width
        : POST_MEDIA_DEFAULT_WIDTH;
    const height =
      typeof obj.height === 'number' && obj.height > 0
        ? obj.height
        : POST_MEDIA_DEFAULT_HEIGHT;

    return {
      altText,
      width,
      height,
      imagePrompt,
      styleNotes:
        typeof obj.styleNotes === 'string' ? obj.styleNotes.trim() : undefined,
    };
  }
}
