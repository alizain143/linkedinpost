import { UserPlan } from '@prisma/client';

/** Plans available for new Lemon checkout sessions (Starter is grandfathered only). */
export const NEW_CHECKOUT_PLANS = [UserPlan.pro, UserPlan.agency] as const;

export type NewCheckoutPlan = (typeof NEW_CHECKOUT_PLANS)[number];

export function isNewCheckoutPlan(plan: UserPlan): plan is NewCheckoutPlan {
  return (NEW_CHECKOUT_PLANS as readonly UserPlan[]).includes(plan);
}
