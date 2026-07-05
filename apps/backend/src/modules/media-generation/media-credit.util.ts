import {
  CAROUSEL_DEFAULT_SLIDE_ESTIMATE,
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_SLIDES,
  MEDIA_CAROUSEL_CREDIT_PER_SLIDE,
  MEDIA_GENERATION_CREDIT_COST,
  MEDIA_TEMPLATE_CREDIT_COST,
} from '../../common/constants/media.constants';
import { MediaFormat, MediaMode } from '@prisma/client';

export function estimateCarouselSlideCount(
  override: number | null | undefined,
): number {
  if (
    override != null &&
    override >= CAROUSEL_MIN_SLIDES &&
    override <= CAROUSEL_MAX_SLIDES
  ) {
    return override;
  }
  return CAROUSEL_DEFAULT_SLIDE_ESTIMATE;
}

export function getCarouselCreditCost(slideCount: number): number {
  return slideCount * MEDIA_CAROUSEL_CREDIT_PER_SLIDE;
}

export function inferSlideCountFromBody(body: string | null | undefined): number {
  if (!body?.trim()) {
    return CAROUSEL_MIN_SLIDES;
  }

  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((line) =>
    /^(\d+[.)]|[-•*])\s+/.test(line),
  ).length;

  if (bulletLines >= 2) {
    return Math.min(CAROUSEL_MAX_SLIDES, Math.max(CAROUSEL_MIN_SLIDES, bulletLines + 2));
  }

  if (body.length > 1200) return 8;
  if (body.length > 600) return 6;
  if (body.length > 300) return 5;
  return CAROUSEL_MIN_SLIDES;
}

export function clampSlideCount(count: number): number {
  return Math.min(
    CAROUSEL_MAX_SLIDES,
    Math.max(CAROUSEL_MIN_SLIDES, Math.round(count)),
  );
}

export function resolveMediaGenerationCreditCost(input: {
  mediaFormat?: MediaFormat | null;
  mediaMode?: MediaMode | null;
  carouselSlideCount?: number | null;
}): number {
  if (input.mediaFormat === MediaFormat.carousel) {
    return getCarouselCreditCost(
      estimateCarouselSlideCount(input.carouselSlideCount),
    );
  }

  if (input.mediaMode === MediaMode.template) {
    return MEDIA_TEMPLATE_CREDIT_COST;
  }

  return MEDIA_GENERATION_CREDIT_COST;
}
