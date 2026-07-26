"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QueryState } from "@/components/app/query-state";
import { usePricingLocale } from "@/components/pricing/pricing-locale-provider";
import { BillingBuyCredits } from "@/components/sections/app/billing/BillingBuyCredits";
import { BillingPlanCard } from "@/components/sections/app/billing/BillingPlanCard";
import { BillingTransactionHistory } from "@/components/sections/app/billing/BillingTransactionHistory";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useBillingStatus,
  useCancelSubscriptionMutation,
  useCheckoutMutation,
  useInvalidateBilling,
} from "@/hooks/api/use-billing-api";
import { useCredits } from "@/hooks/api/use-credits-api";
import { ApiError } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api-error-messages";
import type { CheckoutPlan } from "@/lib/api/types/billing";
import {
  BILLING_CREDIT_COSTS,
  canManageBilling,
  formatSubscriptionRenewal,
  formatSubscriptionStatusLabel,
  getPlanBonuses,
  getVoiceGuaranteeDetail,
} from "@/lib/billing-utils";
import { formatResetDate } from "@/lib/format-relative-time";
import { trackCheckoutStart } from "@/lib/analytics/events";
import { PLANS } from "@/lib/marketing-data";
import { getPlanLabel } from "@/lib/plan-labels";
import { useAppUi } from "@/providers/app-ui-provider";

function BillingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="pp-grid3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-[#eceef4]"
          />
        ))}
      </div>
      <div className="h-20 animate-pulse rounded-2xl bg-[#eceef4]" />
      <div className="pp-grid3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-[18px] bg-[#eceef4]"
          />
        ))}
      </div>
    </div>
  );
}

export default function Billing() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useAppUi();
  const { formatPrice } = usePricingLocale();
  const invalidateBilling = useInvalidateBilling();

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
    refetch: refetchBilling,
  } = useBillingStatus();

  const {
    balance,
    isLoading: creditsLoading,
    error: creditsError,
    refetch: refetchCredits,
    usage,
  } = useCredits();

  const checkoutMutation = useCheckoutMutation();
  const cancelMutation = useCancelSubscriptionMutation();

  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [billingUnavailable, setBillingUnavailable] = useState(false);
  const handledCheckoutReturnRef = useRef(false);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout || handledCheckoutReturnRef.current) {
      return;
    }

    handledCheckoutReturnRef.current = true;

    if (checkout === "success") {
      showToast("Subscription updated", "check_circle");
      invalidateBilling();
    } else if (checkout === "credits_success") {
      showToast("Credits purchase complete", "check_circle");
      invalidateBilling();
    } else if (checkout === "cancel") {
      showToast("Checkout canceled", "cancel");
    }

    router.replace("/app/billing");
  }, [searchParams, showToast, invalidateBilling, router]);

  const handleCheckout = (plan: CheckoutPlan) => {
    setLoadingPlan(plan);
    setBillingUnavailable(false);
    trackCheckoutStart(plan);

    checkoutMutation.mutate(
      { plan },
      {
        onError: (error) => {
          setLoadingPlan(null);
          if (error instanceof ApiError && error.code === "BILLING_UNAVAILABLE") {
            setBillingUnavailable(true);
          }
          showToast(getApiErrorMessage(error), "error");
        },
      },
    );
  };

  const handleCancel = () => {
    const confirmed = window.confirm(
      "Cancel your subscription? You keep access until the end of the current billing period.",
    );
    if (!confirmed) return;

    setBillingUnavailable(false);

    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        showToast("Subscription will cancel at period end", "check_circle");
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "BILLING_UNAVAILABLE") {
          setBillingUnavailable(true);
        }
        showToast(getApiErrorMessage(error), "error");
      },
    });
  };

  const isLoading = billingLoading || creditsLoading || !billing || !balance || !usage;
  const queryError = billingError || creditsError;
  const canCancel =
    billing &&
    canManageBilling(billing) &&
    !billing.cancelAtPeriodEnd &&
    (billing.subscriptionStatus === "active" ||
      billing.subscriptionStatus === "trialing" ||
      billing.subscriptionStatus === "past_due" ||
      billing.subscriptionStatus === "unpaid");

  return (
    <QueryState
      isLoading={isLoading}
      error={queryError}
      onRetry={() => {
        void refetchBilling();
        void refetchCredits();
      }}
      skeleton={<BillingSkeleton />}
    >
      {billing && balance && usage ? (
        <div className="space-y-5">
          {billingUnavailable ? (
            <div className="rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-[#fffdf5] px-5 py-4 text-[13px] text-[#92400e]">
              Billing is not configured in this environment.
            </div>
          ) : null}

          <div className="pp-grid3" data-tour="billing-summary">
            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <div className="text-[12.5px] font-medium text-[#7886a0]">
                Current plan
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                {getPlanLabel(billing.plan)}
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">
                {formatSubscriptionRenewal(billing, balance, formatPrice)}
              </div>
            </div>

            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <div className="text-[12.5px] font-medium text-[#7886a0]">
                Credits used
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                {usage.used} / {usage.limit}
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">
                {usage.usagePercentLabel}% of monthly limit
                {(balance.purchased ?? 0) > 0
                  ? ` · includes ${balance.purchased} purchased`
                  : null}
              </div>
            </div>

            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <div className="text-[12.5px] font-medium text-[#7886a0]">
                Next reset
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                {formatResetDate(balance.periodEnd)}
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">
                Monthly credit cycle
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#64748b]">
                Credit usage
              </span>
              <span className="font-display text-sm font-bold">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#f1f3f8]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]"
                style={{
                  width: `${usage.usagePercent}%`,
                }}
              />
            </div>
          </div>

          {canCancel || billing.cancelAtPeriodEnd ? (
            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display font-bold">Manage subscription</h3>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {formatSubscriptionStatusLabel(
                      billing.subscriptionStatus,
                      billing.cancelAtPeriodEnd,
                      billing.currentPeriodEnd,
                    )}
                  </p>
                  {billing.subscriptionStatus === "past_due" ||
                  billing.subscriptionStatus === "unpaid" ? (
                    <p className="mt-1 text-sm font-medium text-[#dc2626]">
                      There is a payment issue with your subscription. Try
                      upgrading again or contact support.
                    </p>
                  ) : null}
                </div>
                {canCancel ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="md"
                    className="rounded-[10px]"
                    disabled={cancelMutation.isPending}
                    onClick={handleCancel}
                  >
                    <MsIcon name="cancel" size={18} />
                    {cancelMutation.isPending
                      ? "Cancelling…"
                      : "Cancel subscription"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="mb-4 font-display text-lg font-bold">Plans</h3>
            {billing.plan === "starter" ? (
              <div className="mb-4 rounded-[14px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
                Your Starter plan is no longer sold. Upgrade to Pro for weekly
                channel volume, bonuses, and the 7-day voice guarantee.
              </div>
            ) : null}
            <div className="pp-grid3">
              {PLANS.map((plan) => (
                <BillingPlanCard
                  key={plan.name}
                  plan={plan}
                  currentPlan={billing.plan}
                  loadingPlan={loadingPlan}
                  onCheckout={handleCheckout}
                />
              ))}
            </div>
            <p className="mt-4 text-sm leading-[1.55] text-[#64748b]">
              {getVoiceGuaranteeDetail()}
            </p>
            {billing.plan === "pro" || billing.plan === "agency" ? (
              <div className="mt-5 rounded-2xl border border-[#eceef4] bg-white p-5">
                <h3 className="mb-3 font-display font-bold">Your plan bonuses</h3>
                <ul className="space-y-2 text-sm">
                  {getPlanBonuses(billing.plan).map((bonus) => (
                    <li key={bonus.id}>
                      <Link
                        href={bonus.href}
                        className="font-semibold text-[#4f46e5] hover:underline"
                      >
                        {bonus.title}
                      </Link>
                      <span className="text-[#64748b]">
                        {" "}
                        · {bonus.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <BillingBuyCredits />

          <BillingTransactionHistory />

          <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
            <h3 className="mb-4 font-display font-bold">How credits work</h3>
            <div className="space-y-2 text-sm">
              {BILLING_CREDIT_COSTS.map(({ action, cost }) => (
                <div
                  key={action}
                  className="flex justify-between border-b border-[#f1f3f8] py-2 last:border-0"
                >
                  <span className="text-[#64748b]">{action}</span>
                  <span className="font-semibold">{cost}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}
