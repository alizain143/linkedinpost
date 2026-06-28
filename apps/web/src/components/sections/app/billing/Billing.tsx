"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QueryState } from "@/components/app/query-state";
import { BillingPlanCard } from "@/components/sections/app/billing/BillingPlanCard";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  useBillingStatus,
  useCheckoutMutation,
  useInvalidateBilling,
  usePortalMutation,
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
} from "@/lib/billing-utils";
import { formatResetDate } from "@/lib/format-relative-time";
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
      <div className="pp-grid4">
        {Array.from({ length: 4 }).map((_, index) => (
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
    percentUsed,
  } = useCredits();

  const checkoutMutation = useCheckoutMutation();
  const portalMutation = usePortalMutation();

  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [billingUnavailable, setBillingUnavailable] = useState(false);
  const handledCheckoutReturnRef = useRef(false);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout || handledCheckoutReturnRef.current) return;

    handledCheckoutReturnRef.current = true;

    if (checkout === "success") {
      showToast("Subscription updated", "check_circle");
      invalidateBilling();
    } else if (checkout === "cancel") {
      showToast("Checkout canceled", "cancel");
    }

    router.replace("/app/billing");
  }, [searchParams, showToast, invalidateBilling, router]);

  const handleCheckout = (plan: CheckoutPlan) => {
    setLoadingPlan(plan);
    setBillingUnavailable(false);

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

  const handlePortal = () => {
    setBillingUnavailable(false);

    portalMutation.mutate(undefined, {
      onError: (error) => {
        if (error instanceof ApiError && error.code === "BILLING_UNAVAILABLE") {
          setBillingUnavailable(true);
        }
        showToast(getApiErrorMessage(error), "error");
      },
    });
  };

  const isLoading = billingLoading || creditsLoading || !billing || !balance;
  const queryError = billingError || creditsError;

  return (
    <QueryState
      isLoading={isLoading}
      error={queryError as Error | null}
      onRetry={() => {
        void refetchBilling();
        void refetchCredits();
      }}
      skeleton={<BillingSkeleton />}
    >
      {billing && balance ? (
        <div className="space-y-5">
          {billingUnavailable ? (
            <div className="rounded-2xl border border-[#fde68a] bg-gradient-to-br from-[#fffbeb] to-[#fffdf5] px-5 py-4 text-[13px] text-[#92400e]">
              Billing is not configured in this environment.
            </div>
          ) : null}

          <div className="pp-grid3">
            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <div className="text-[12.5px] font-medium text-[#7886a0]">
                Current plan
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                {getPlanLabel(billing.plan)}
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">
                {formatSubscriptionRenewal(billing, balance)}
              </div>
            </div>

            <div className="rounded-2xl border border-[#eceef4] bg-white p-5">
              <div className="text-[12.5px] font-medium text-[#7886a0]">
                Credits used
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold tracking-tight">
                {balance.used} / {balance.limit}
              </div>
              <div className="mt-1 text-xs text-[#94a3b8]">
                {balance.percentUsed.toFixed(1)}% of monthly limit
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
                {balance.used} / {balance.limit}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#f1f3f8]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]"
                style={{
                  width: `${Math.min(100, Math.max(0, percentUsed))}%`,
                }}
              />
            </div>
          </div>

          {canManageBilling(billing) ? (
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
                  {billing.cancelAtPeriodEnd && billing.currentPeriodEnd ? (
                    <p className="mt-1 text-sm text-[#92400e]">
                      Your plan cancels on{" "}
                      {formatResetDate(billing.currentPeriodEnd)}.
                    </p>
                  ) : null}
                  {billing.subscriptionStatus === "past_due" ? (
                    <p className="mt-1 text-sm font-medium text-[#dc2626]">
                      There is a payment issue with your subscription. Update
                      your payment method in Stripe.
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="rounded-[10px]"
                  disabled={portalMutation.isPending}
                  onClick={handlePortal}
                >
                  <MsIcon name="credit_card" size={18} />
                  {portalMutation.isPending
                    ? "Opening portal…"
                    : "Manage billing"}
                </Button>
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="mb-4 font-display text-lg font-bold">Plans</h3>
            <div className="pp-grid4">
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
          </div>

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
