import { Injectable } from '@nestjs/common';
import {
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_SLIDES,
} from '../../common/constants/media.constants';
import { generationParseError } from '../generation/generation.errors';
import { clampSlideCount } from '../media-generation/media-credit.util';
import {
  CarouselPageRole,
  CarouselSlideSlotContent,
  CarouselSlotFillResult,
} from './layout.types';

@Injectable()
export class CarouselSlotFillParser {
  parse(content: string): CarouselSlotFillResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError('Carousel slot fill output is not valid JSON');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError('Carousel slot fill output must be an object');
    }

    const obj = parsed as Record<string, unknown>;
    const slidesRaw = Array.isArray(obj.slides) ? obj.slides : [];
    const totalSlides = clampSlideCount(
      typeof obj.totalSlides === 'number'
        ? obj.totalSlides
        : slidesRaw.length || CAROUSEL_MIN_SLIDES,
    );

    const slides: CarouselSlideSlotContent[] = slidesRaw
      .map((slide) => this.parseSlide(slide))
      .filter((slide): slide is CarouselSlideSlotContent => slide !== null);

    if (slides.length === 0) {
      throw generationParseError('Carousel slot fill requires at least one slide');
    }

    const normalized = this.normalizeSlides(slides, totalSlides);

    return {
      totalSlides: normalized.length,
      slides: normalized,
    };
  }

  private parseSlide(raw: unknown): CarouselSlideSlotContent | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const headline =
      typeof obj.headline === 'string' ? obj.headline.trim() : '';
    if (!headline) return null;

    const role = this.parseRole(obj.role);

    return {
      role,
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

  private parseRole(raw: unknown): CarouselPageRole {
    if (raw === 'first' || raw === 'middle' || raw === 'last') {
      return raw;
    }
    return 'middle';
  }

  private normalizeSlides(
    slides: CarouselSlideSlotContent[],
    targetCount: number,
  ): CarouselSlideSlotContent[] {
    const count = clampSlideCount(
      Math.min(CAROUSEL_MAX_SLIDES, Math.max(CAROUSEL_MIN_SLIDES, targetCount)),
    );

    if (slides.length === count) {
      return this.ensureRoleStructure(slides);
    }

    if (slides.length > count) {
      return this.ensureRoleStructure(slides.slice(0, count));
    }

    const padded = [...slides];
    while (padded.length < count) {
      const lastMiddle = [...padded]
        .reverse()
        .find((slide) => slide.role === 'middle');
      padded.splice(padded.length - 1, 0, {
        role: 'middle',
        headline: lastMiddle?.headline ?? 'Key point',
        subhead: lastMiddle?.subhead,
        visualPrompt: lastMiddle?.visualPrompt,
        altText: lastMiddle?.altText ?? 'Carousel slide',
      });
    }

    return this.ensureRoleStructure(padded);
  }

  private ensureRoleStructure(
    slides: CarouselSlideSlotContent[],
  ): CarouselSlideSlotContent[] {
    if (slides.length === 0) return slides;

    const result = [...slides];
    result[0] = { ...result[0], role: 'first' };
    if (result.length > 1) {
      result[result.length - 1] = {
        ...result[result.length - 1],
        role: 'last',
      };
    }
    for (let i = 1; i < result.length - 1; i += 1) {
      result[i] = { ...result[i], role: 'middle' };
    }
    return result;
  }
}
