import { UserPlan } from '@prisma/client';
import {
  NEW_CHECKOUT_PLANS,
  type NewCheckoutPlan,
} from './checkout-plans';

export interface LemonVariantConfig {
  variantPro?: string;
  variantAgency?: string;
}

/** All paid plans including legacy Starter (DB / webhook sync). */
export const PAID_PLANS = [
  UserPlan.starter,
  UserPlan.pro,
  UserPlan.agency,
] as const;

export type PaidPlan = (typeof PAID_PLANS)[number];

/** @deprecated Use NewCheckoutPlan / NEW_CHECKOUT_PLANS for new checkouts. */
export type CheckoutPlan = PaidPlan;

export function isCheckoutPlan(plan: UserPlan): plan is PaidPlan {
  return (PAID_PLANS as readonly UserPlan[]).includes(plan);
}

export function getLemonVariantForPlan(
  plan: UserPlan,
  variants: LemonVariantConfig,
): string | null {
  switch (plan) {
    case UserPlan.pro:
      return variants.variantPro ?? null;
    case UserPlan.agency:
      return variants.variantAgency ?? null;
    default:
      return null;
  }
}

export function getPlanForLemonVariant(
  variantId: string | number | null | undefined,
  variants: LemonVariantConfig,
): NewCheckoutPlan | null {
  if (variantId == null) {
    return null;
  }

  const id = String(variantId);

  if (variants.variantPro && id === String(variants.variantPro)) {
    return UserPlan.pro;
  }
  if (variants.variantAgency && id === String(variants.variantAgency)) {
    return UserPlan.agency;
  }

  return null;
}

export function parsePlanFromMetadata(
  plan: string | undefined | null,
): PaidPlan | null {
  if (!plan) {
    return null;
  }

  if (
    plan === UserPlan.starter ||
    plan === UserPlan.pro ||
    plan === UserPlan.agency
  ) {
    return plan;
  }

  return null;
}

export function getPlanLabel(plan: PaidPlan | NewCheckoutPlan): string {
  switch (plan) {
    case UserPlan.starter:
      return 'Starter';
    case UserPlan.pro:
      return 'Pro';
    case UserPlan.agency:
      return 'Agency';
  }
}

export { NEW_CHECKOUT_PLANS };
export type { NewCheckoutPlan };
