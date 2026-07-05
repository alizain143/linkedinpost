import { Injectable } from '@nestjs/common';
import {
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_SLIDES,
} from '../../common/constants/media.constants';
import { generationParseError } from '../generation/generation.errors';
import { CarouselPageRole } from '../media-templates/layout.types';
import { clampSlideCount } from './media-credit.util';

export interface FreestyleCarouselSlidePlan {
  role: CarouselPageRole;
  imagePrompt: string;
  altText: string;
}

export interface FreestyleCarouselPlan {
  totalSlides: number;
  sharedStyleNotes: string;
  slides: FreestyleCarouselSlidePlan[];
}

@Injectable()
export class FreestyleCarouselPlanParser {
  parse(content: string): FreestyleCarouselPlan {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw generationParseError(
        'Freestyle carousel plan output is not valid JSON',
      );
    }

    if (!parsed || typeof parsed !== 'object') {
      throw generationParseError(
        'Freestyle carousel plan output must be an object',
      );
    }

    const obj = parsed as Record<string, unknown>;
    const slidesRaw = Array.isArray(obj.slides) ? obj.slides : [];
    const totalSlides = clampSlideCount(
      typeof obj.totalSlides === 'number'
        ? obj.totalSlides
        : slidesRaw.length || CAROUSEL_MIN_SLIDES,
    );

    const slides = slidesRaw
      .map((slide) => this.parseSlide(slide))
      .filter((slide): slide is FreestyleCarouselSlidePlan => slide !== null);

    if (slides.length === 0) {
      throw generationParseError(
        'Freestyle carousel plan requires at least one slide',
      );
    }

    const normalized = this.normalizeSlides(slides, totalSlides);
    const sharedStyleNotes =
      typeof obj.sharedStyleNotes === 'string'
        ? obj.sharedStyleNotes.trim()
        : 'Professional LinkedIn carousel, cohesive visual style';

    return {
      totalSlides: normalized.length,
      sharedStyleNotes,
      slides: normalized,
    };
  }

  private parseSlide(raw: unknown): FreestyleCarouselSlidePlan | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const imagePrompt =
      typeof obj.imagePrompt === 'string' ? obj.imagePrompt.trim() : '';
    if (!imagePrompt) return null;

    const role = this.parseRole(obj.role);
    const altText =
      typeof obj.altText === 'string' && obj.altText.trim()
        ? obj.altText.trim()
        : imagePrompt.slice(0, 120);

    return { role, imagePrompt, altText };
  }

  private parseRole(raw: unknown): CarouselPageRole {
    if (raw === 'first' || raw === 'middle' || raw === 'last') {
      return raw;
    }
    return 'middle';
  }

  private normalizeSlides(
    slides: FreestyleCarouselSlidePlan[],
    targetCount: number,
  ): FreestyleCarouselSlidePlan[] {
    const count = clampSlideCount(
      Math.min(CAROUSEL_MAX_SLIDES, Math.max(CAROUSEL_MIN_SLIDES, targetCount)),
    );

    let result =
      slides.length > count ? slides.slice(0, count) : [...slides];

    while (result.length < count) {
      const template =
        result.find((slide) => slide.role === 'middle') ?? result[0];
      result.splice(result.length - 1, 0, {
        role: 'middle',
        imagePrompt: template.imagePrompt,
        altText: template.altText,
      });
    }

    result[0] = { ...result[0], role: 'first' };
    if (result.length > 1) {
      result[result.length - 1] = { ...result[result.length - 1], role: 'last' };
    }
    for (let i = 1; i < result.length - 1; i += 1) {
      result[i] = { ...result[i], role: 'middle' };
    }

    return result;
  }
}
