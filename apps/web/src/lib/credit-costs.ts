import type { ApiCreditsBalance } from "@/lib/api/types/credits";
import type { MediaFormat, MediaMode } from "@/lib/api/types/media-template";

export const QUICK_DRAFT_CREDIT_COST = 1;
export const COUNCIL_CREDIT_COST = 3;
export const MEDIA_GENERATION_CREDIT_COST = 2;
export const MEDIA_TEMPLATE_CREDIT_COST = 1;
export const MEDIA_CAROUSEL_CREDIT_PER_SLIDE = 2;
export const CAROUSEL_MIN_SLIDES = 3;
export const CAROUSEL_MAX_SLIDES = 10;
export const CAROUSEL_DEFAULT_SLIDE_ESTIMATE = 7;
export const AUTOPILOT_CREDIT_COST = 3;
export const CONTENT_PROFILE_AI_CREDIT_COST = 1;

export type CalendarSlotGenerationMode = "quick_draft" | "council";

export const GENERATION_MODE_COSTS = {
  quick: QUICK_DRAFT_CREDIT_COST,
  council: COUNCIL_CREDIT_COST,
} as const;

export type GenerationModeId = keyof typeof GENERATION_MODE_COSTS;

export function canAffordCredits(remaining: number, cost: number): boolean {
  return remaining >= cost;
}

export function isCreditsExhausted(balance: ApiCreditsBalance): boolean {
  return balance.remaining === 0;
}

export function getGenerationModeCost(mode: string): number {
  if (mode in GENERATION_MODE_COSTS) {
    return GENERATION_MODE_COSTS[mode as GenerationModeId];
  }
  return QUICK_DRAFT_CREDIT_COST;
}

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

export function resolveMediaGenerationCreditCost(input: {
  mediaFormat?: MediaFormat | null;
  mediaMode?: MediaMode | null;
  carouselSlideCount?: number | null;
}): number {
  if (input.mediaFormat === "carousel") {
    return getCarouselCreditCost(
      estimateCarouselSlideCount(input.carouselSlideCount),
    );
  }
  if (input.mediaMode === "template") {
    return MEDIA_TEMPLATE_CREDIT_COST;
  }
  return MEDIA_GENERATION_CREDIT_COST;
}

export function resolveCouncilCreditCost(input: {
  mediaFormat?: MediaFormat | null;
  carouselSlideCount?: number | null;
}): number {
  if (input.mediaFormat === "carousel") {
    return (
      QUICK_DRAFT_CREDIT_COST +
      getCarouselCreditCost(estimateCarouselSlideCount(input.carouselSlideCount))
    );
  }
  return COUNCIL_CREDIT_COST;
}

export function calendarCreditCost(
  slotCount: number,
  mode: CalendarSlotGenerationMode,
  options?: {
    mediaFormat?: MediaFormat;
    carouselSlideCount?: number | null;
  },
): number {
  if (mode === "quick_draft") {
    return slotCount;
  }
  if (options?.mediaFormat === "carousel") {
    const perSlot =
      QUICK_DRAFT_CREDIT_COST +
      getCarouselCreditCost(
        estimateCarouselSlideCount(options.carouselSlideCount),
      );
    return slotCount * perSlot;
  }
  return slotCount * COUNCIL_CREDIT_COST;
}
