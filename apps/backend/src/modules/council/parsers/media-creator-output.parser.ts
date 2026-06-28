import { Injectable } from '@nestjs/common';
import { PostMediaType } from '@prisma/client';
import { generationParseError } from '../../generation/generation.errors';
import {
  POST_MEDIA_DEFAULT_HEIGHT,
  POST_MEDIA_DEFAULT_WIDTH,
} from '../../../common/constants/media.constants';

const VALID_MEDIA_TYPES = new Set<string>(Object.values(PostMediaType));

export interface MediaCreatorOutput {
  mediaType: PostMediaType;
  altText: string;
  width: number;
  height: number;
  headlineText?: string;
  imagePrompt?: string;
  styleNotes?: string;
  statValue?: string;
  statLabel?: string;
  tips?: string[];
  ctaFooter?: string;
  accentPhrase?: string;
  supportingLine?: string;
  footerTags?: string;
  flowSteps?: string[];
}

@Injectable()
export class MediaCreatorOutputParser {
  parse(content: string, fallbackMediaType?: PostMediaType): MediaCreatorOutput {
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
    const mediaType = String(
      obj.mediaType ?? fallbackMediaType ?? PostMediaType.branded_quote_card,
    ) as PostMediaType;

    if (!VALID_MEDIA_TYPES.has(mediaType)) {
      throw generationParseError(`Unsupported mediaType: ${mediaType}`);
    }

    const altText = String(obj.altText ?? obj.headlineText ?? 'LinkedIn post media').trim();
    const width =
      typeof obj.width === 'number' && obj.width > 0
        ? obj.width
        : POST_MEDIA_DEFAULT_WIDTH;
    const height =
      typeof obj.height === 'number' && obj.height > 0
        ? obj.height
        : POST_MEDIA_DEFAULT_HEIGHT;

    const base: MediaCreatorOutput = {
      mediaType,
      altText,
      width,
      height,
      headlineText:
        typeof obj.headlineText === 'string' ? obj.headlineText.trim() : undefined,
      imagePrompt:
        typeof obj.imagePrompt === 'string' ? obj.imagePrompt.trim() : undefined,
      styleNotes:
        typeof obj.styleNotes === 'string' ? obj.styleNotes : undefined,
      statValue:
        typeof obj.statValue === 'string' ? obj.statValue.trim() : undefined,
      statLabel:
        typeof obj.statLabel === 'string' ? obj.statLabel.trim() : undefined,
      ctaFooter:
        typeof obj.ctaFooter === 'string' ? obj.ctaFooter.trim() : undefined,
      tips: Array.isArray(obj.tips)
        ? obj.tips.map((tip) => String(tip).trim()).filter(Boolean).slice(0, 5)
        : undefined,
      accentPhrase:
        typeof obj.accentPhrase === 'string'
          ? obj.accentPhrase.trim()
          : undefined,
      supportingLine:
        typeof obj.supportingLine === 'string'
          ? obj.supportingLine.trim()
          : undefined,
      footerTags:
        typeof obj.footerTags === 'string' ? obj.footerTags.trim() : undefined,
      flowSteps: Array.isArray(obj.flowSteps)
        ? obj.flowSteps
            .map((step) => String(step).trim())
            .filter(Boolean)
            .slice(0, 3)
        : undefined,
    };

    this.validateForType(base);
    return base;
  }

  private validateForType(output: MediaCreatorOutput): void {
    switch (output.mediaType) {
      case PostMediaType.branded_quote_card:
      case PostMediaType.quote_card:
        if (!output.headlineText) {
          throw generationParseError('headlineText is required for quote cards');
        }
        if (
          output.mediaType === PostMediaType.quote_card &&
          !output.imagePrompt
        ) {
          throw generationParseError('imagePrompt is required for quote_card');
        }
        break;
      case PostMediaType.stat_highlight:
        if (!output.statValue || !output.statLabel) {
          throw generationParseError(
            'statValue and statLabel are required for stat_highlight',
          );
        }
        break;
      case PostMediaType.tip_card:
        if (!output.tips || output.tips.length === 0) {
          throw generationParseError('tips array is required for tip_card');
        }
        break;
      case PostMediaType.infographic:
      case PostMediaType.photo_illustration:
        if (!output.imagePrompt) {
          throw generationParseError('imagePrompt is required for generative media');
        }
        break;
      default:
        break;
    }
  }
}
