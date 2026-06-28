import type { UserPlan } from "@/lib/api/types/enums";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export type ApiBillingStatus = {
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
};

export type CheckoutPlan = "starter" | "pro" | "agency";

export type CreateCheckoutBody = {
  plan: CheckoutPlan;
};

export type BillingSessionResponse = {
  url: string;
};
