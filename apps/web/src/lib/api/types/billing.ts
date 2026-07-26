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
  lemonCustomerId: string | null;
  hasBillingAccount: boolean;
};

export type CheckoutPlan = "pro" | "agency";

export type CreateCheckoutBody = {
  plan: CheckoutPlan;
};

export type BillingSessionResponse = {
  url: string;
};

export type CancelSubscriptionResponse = {
  cancelled: boolean;
};

export type CreditTopupQuote = {
  credits: number;
  unitPriceCents: number;
  totalCents: number;
  listTotalCents: number;
  discountPercent: number;
};

export type CreateCreditCheckoutBody = {
  credits: number;
};

export type BillingTransactionType =
  | "subscription_payment"
  | "credit_purchase"
  | "refund";

export type BillingTransactionStatus = "paid" | "refunded" | "failed";

export type ApiBillingTransaction = {
  id: string;
  type: BillingTransactionType;
  status: BillingTransactionStatus;
  amountCents: number;
  currency: string;
  description: string | null;
  creditsGranted: number | null;
  plan: UserPlan | null;
  occurredAt: string;
};

export type ApiBillingTransactionsResponse = {
  items: ApiBillingTransaction[];
  nextCursor: string | null;
};
