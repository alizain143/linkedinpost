import type { ApiBillingStatus, CheckoutPlan } from "@/lib/api/types/billing";
import type { ApiCreditsBalance } from "@/lib/api/types/credits";
import type { UserPlan } from "@/lib/api/types/enums";
import {
  AUTOPILOT_CREDIT_COST,
  CONTENT_PROFILE_AI_CREDIT_COST,
  COUNCIL_CREDIT_COST,
  MEDIA_GENERATION_CREDIT_COST,
  QUICK_DRAFT_CREDIT_COST,
} from "@/lib/credit-costs";
import { formatResetDate } from "@/lib/format-relative-time";
import { PLANS } from "@/lib/marketing-data";
import { getPlanLabel } from "@/lib/plan-labels";

export const CHECKOUT_PLANS: CheckoutPlan[] = ["starter", "pro", "agency"];

export const BILLING_CREDIT_COSTS = [
  { action: "Quick draft", cost: `${QUICK_DRAFT_CREDIT_COST} credit` },
  { action: "AI Council", cost: `${COUNCIL_CREDIT_COST} credits` },
  {
    action: "Generate image",
    cost: `${MEDIA_GENERATION_CREDIT_COST} credits`,
  },
  {
    action: "7-day calendar (text)",
    cost: `7 credits (1/post)`,
  },
  {
    action: "7-day calendar (AI Council)",
    cost: `21 credits (3/post)`,
  },
  {
    action: "30-day calendar (text)",
    cost: `30 credits (1/post)`,
  },
  {
    action: "30-day calendar (AI Council)",
    cost: `90 credits (3/post)`,
  },
  { action: "Autopilot post", cost: `${AUTOPILOT_CREDIT_COST} credits` },
  {
    action: "AI content profile",
    cost: `${CONTENT_PROFILE_AI_CREDIT_COST} credit each`,
  },
] as const;

const PLAN_NAME_MAP: Record<string, UserPlan> = {
  free: "free",
  starter: "starter",
  pro: "pro",
  agency: "agency",
};

export function planNameToUserPlan(name: string): UserPlan | null {
  return PLAN_NAME_MAP[name.toLowerCase()] ?? null;
}

export function getPlanPriceLabel(plan: UserPlan): string | null {
  const marketingPlan = PLANS.find(
    (entry) => planNameToUserPlan(entry.name) === plan,
  );
  return marketingPlan?.price ?? null;
}

export function isCheckoutPlan(plan: UserPlan): plan is CheckoutPlan {
  return CHECKOUT_PLANS.includes(plan as CheckoutPlan);
}

export function canManageBilling(billing: ApiBillingStatus): boolean {
  return billing.hasBillingAccount;
}

export function formatSubscriptionStatusLabel(
  status: ApiBillingStatus["subscriptionStatus"],
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd: string | null,
): string {
  if (cancelAtPeriodEnd && currentPeriodEnd) {
    return `Cancels ${formatResetDate(currentPeriodEnd)}`;
  }

  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "incomplete":
      return "Incomplete";
    case "unpaid":
      return "Unpaid";
    default:
      return "Free tier";
  }
}

export function formatSubscriptionRenewal(
  billing: ApiBillingStatus,
  credits: ApiCreditsBalance,
): string {
  const price = getPlanPriceLabel(billing.plan);

  if (billing.plan === "free") {
    return "Free tier";
  }

  if (billing.cancelAtPeriodEnd && billing.currentPeriodEnd) {
    const pricePart = price ? `${price} / month · ` : "";
    return `${pricePart}Cancels ${formatResetDate(billing.currentPeriodEnd)}`;
  }

  if (billing.currentPeriodEnd) {
    const pricePart = price ? `${price} / month · ` : "";
    return `${pricePart}Renews ${formatResetDate(billing.currentPeriodEnd)}`;
  }

  if (price) {
    return `${price} / month`;
  }

  return `${getPlanLabel(billing.plan)} plan`;
}

export function getPlanCardCta(
  plan: UserPlan,
  currentPlan: UserPlan,
): { label: string; disabled: boolean; checkoutPlan: CheckoutPlan | null } {
  if (plan === currentPlan) {
    return { label: "Current plan", disabled: true, checkoutPlan: null };
  }

  if (plan === "free") {
    return { label: "Free tier", disabled: true, checkoutPlan: null };
  }

  if (!isCheckoutPlan(plan)) {
    return { label: "Unavailable", disabled: true, checkoutPlan: null };
  }

  const planOrder: UserPlan[] = ["free", "starter", "pro", "agency"];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(plan);

  if (targetIndex > currentIndex) {
    return {
      label: `Upgrade to ${getPlanLabel(plan)}`,
      disabled: false,
      checkoutPlan: plan,
    };
  }

  return {
    label: `Start ${getPlanLabel(plan)}`,
    disabled: false,
    checkoutPlan: plan,
  };
}
