import { UserPlan } from '@prisma/client';

export interface StripePriceConfig {
  priceStarter?: string;
  pricePro?: string;
  priceAgency?: string;
}

export function getStripePriceIdForPlan(
  plan: UserPlan,
  prices: StripePriceConfig,
): string | null {
  switch (plan) {
    case UserPlan.starter:
      return prices.priceStarter ?? null;
    case UserPlan.pro:
      return prices.pricePro ?? null;
    case UserPlan.agency:
      return prices.priceAgency ?? null;
    default:
      return null;
  }
}

export function getPlanForStripePriceId(
  priceId: string,
  prices: StripePriceConfig,
): UserPlan | null {
  if (prices.priceStarter && priceId === prices.priceStarter) {
    return UserPlan.starter;
  }
  if (prices.pricePro && priceId === prices.pricePro) {
    return UserPlan.pro;
  }
  if (prices.priceAgency && priceId === prices.priceAgency) {
    return UserPlan.agency;
  }
  return null;
}
