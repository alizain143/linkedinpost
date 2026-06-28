import type { ApiCreditsBalance } from "@/lib/api/types/credits";

export const QUICK_DRAFT_CREDIT_COST = 1;
export const COUNCIL_CREDIT_COST = 3;
export const MEDIA_GENERATION_CREDIT_COST = 5;
export const PREMIUM_COUNCIL_CREDIT_COST = 10;
export const CALENDAR_7_DAY_CREDIT_COST = 10;
export const CALENDAR_30_DAY_CREDIT_COST = 30;
export const AUTOPILOT_CREDIT_COST = 10;

export const GENERATION_MODE_COSTS = {
  quick: QUICK_DRAFT_CREDIT_COST,
  council: COUNCIL_CREDIT_COST,
  media: PREMIUM_COUNCIL_CREDIT_COST,
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
