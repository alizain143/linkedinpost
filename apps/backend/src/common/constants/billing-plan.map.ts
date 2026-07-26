import { UserPlan } from '@prisma/client';

export interface LemonVariantConfig {
  variantStarter?: string;
  variantPro?: string;
  variantAgency?: string;
}

const PAID_PLANS = [UserPlan.starter, UserPlan.pro, UserPlan.agency] as const;

export type CheckoutPlan = (typeof PAID_PLANS)[number];

export function isCheckoutPlan(plan: UserPlan): plan is CheckoutPlan {
  return (PAID_PLANS as readonly UserPlan[]).includes(plan);
}

export function getLemonVariantForPlan(
  plan: UserPlan,
  variants: LemonVariantConfig,
): string | null {
  switch (plan) {
    case UserPlan.starter:
      return variants.variantStarter ?? null;
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
): CheckoutPlan | null {
  if (variantId == null) {
    return null;
  }

  const id = String(variantId);

  if (variants.variantStarter && id === String(variants.variantStarter)) {
    return UserPlan.starter;
  }
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
): CheckoutPlan | null {
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
