import { UserPlan } from '@prisma/client';

export interface XpayAmountConfig {
  amountStarter?: number;
  amountPro?: number;
  amountAgency?: number;
}

const PAID_PLANS = [UserPlan.starter, UserPlan.pro, UserPlan.agency] as const;

export type CheckoutPlan = (typeof PAID_PLANS)[number];

export function isCheckoutPlan(plan: UserPlan): plan is CheckoutPlan {
  return (PAID_PLANS as readonly UserPlan[]).includes(plan);
}

export function getXpayAmountForPlan(
  plan: UserPlan,
  amounts: XpayAmountConfig,
): number | null {
  switch (plan) {
    case UserPlan.starter:
      return amounts.amountStarter ?? null;
    case UserPlan.pro:
      return amounts.amountPro ?? null;
    case UserPlan.agency:
      return amounts.amountAgency ?? null;
    default:
      return null;
  }
}

export function parsePlanFromMetadata(
  plan: string | undefined | null,
): CheckoutPlan | null {
  if (!plan) {
    return null;
  }

  if (plan === UserPlan.starter || plan === UserPlan.pro || plan === UserPlan.agency) {
    return plan;
  }

  return null;
}

export function getPlanLabel(plan: CheckoutPlan): string {
  switch (plan) {
    case UserPlan.starter:
      return 'Starter';
    case UserPlan.pro:
      return 'Pro';
    case UserPlan.agency:
      return 'Agency';
  }
}
