"use client";

import { PlanPrice } from "@/components/pricing/plan-price";
import { MsIcon } from "@/components/ui/ms-icon";
import type { CheckoutPlan } from "@/lib/api/types/billing";
import type { UserPlan } from "@/lib/api/types/enums";
import { getPlanCardCta, planNameToUserPlan } from "@/lib/billing-utils";
import type { PlanTier } from "@/lib/marketing-data";

type BillingPlanCardProps = {
  plan: PlanTier;
  currentPlan: UserPlan;
  loadingPlan: CheckoutPlan | null;
  onCheckout: (plan: CheckoutPlan) => void;
};

export function BillingPlanCard({
  plan,
  currentPlan,
  loadingPlan,
  onCheckout,
}: BillingPlanCardProps) {
  const userPlan = planNameToUserPlan(plan.name);
  if (!userPlan) return null;

  const isCurrent = userPlan === currentPlan;
  const { label, disabled, checkoutPlan } = getPlanCardCta(
    userPlan,
    currentPlan,
  );
  const isLoading = !!checkoutPlan && loadingPlan === checkoutPlan;
  const s = plan.style;

  return (
    <div
      className="relative rounded-[18px] px-[22px] py-[26px]"
      style={{
        background: s.cardBg,
        border: s.cardBorder,
        boxShadow: s.cardShadow,
      }}
    >
      {plan.popular ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-[13px] py-[5px] text-[11px] font-bold tracking-[0.02em] text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
          MOST POPULAR
        </div>
      ) : null}
      {isCurrent ? (
        <div className="absolute right-4 top-4 rounded-full bg-[#eef2ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4f46e5]">
          Current
        </div>
      ) : null}
      <div
        className="mb-1 font-display text-base font-bold"
        style={{ color: s.nameColor }}
      >
        {plan.name}
      </div>
      <div className="mb-[5px] flex items-baseline gap-[3px]">
        <PlanPrice
          amountUsd={plan.monthlyUsd}
          className="font-display text-[38px] font-extrabold tracking-[-0.03em]"
          style={{ color: s.priceColor }}
        />
        <span className="text-sm font-medium" style={{ color: s.muted }}>
          /month
        </span>
      </div>
      <p
        className="mb-[18px] min-h-9 text-[13px] leading-[1.5]"
        style={{ color: s.muted }}
      >
        {plan.blurb}
      </p>
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => {
          if (checkoutPlan) {
            onCheckout(checkoutPlan);
          }
        }}
        className="mb-5 flex w-full items-center justify-center rounded-[10px] py-[11px] text-sm font-semibold transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: s.btnBg,
          border: s.btnBorder,
          color: s.btnColor,
        }}
      >
        {isLoading ? "Redirecting…" : label}
      </button>
      <div className="flex flex-col gap-[11px]">
        {plan.features.map((feat) => (
          <div
            key={feat}
            className="flex items-start gap-[9px] text-[13.5px] leading-[1.4]"
            style={{ color: s.featColor }}
          >
            <MsIcon
              name="check"
              size={17}
              className="mt-0.5 shrink-0"
              style={{ color: s.check }}
            />
            {feat}
          </div>
        ))}
      </div>
    </div>
  );
}
