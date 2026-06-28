import { SubscriptionStatus } from '@prisma/client';

export interface CreditPeriod {
  periodStart: Date;
  periodEnd: Date;
}

const BILLING_ALIGNED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
  SubscriptionStatus.past_due,
];

export function getUtcMonthPeriod(now = new Date()): CreditPeriod {
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  return { periodStart, periodEnd };
}

export function resolveCreditPeriod(
  subscription: {
    status: SubscriptionStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  } | null,
  now = new Date(),
): CreditPeriod {
  if (
    subscription &&
    BILLING_ALIGNED_STATUSES.includes(subscription.status) &&
    subscription.currentPeriodStart &&
    subscription.currentPeriodEnd
  ) {
    return {
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    };
  }

  return getUtcMonthPeriod(now);
}
