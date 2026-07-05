"use client";

import { cn } from "@/lib/utils";
import { usePricingLocale } from "@/components/pricing/pricing-locale-provider";

export const planPriceClassName =
  "min-w-0 font-display text-[clamp(1.625rem,4.5vw,2.375rem)] font-extrabold leading-none tracking-[-0.03em]";

type PlanPriceProps = {
  amountUsd: number;
  className?: string;
  style?: React.CSSProperties;
};

export function PlanPrice({ amountUsd, className, style }: PlanPriceProps) {
  const { formatPrice } = usePricingLocale();
  return (
    <span className={cn(planPriceClassName, className)} style={style}>
      {formatPrice(amountUsd)}
    </span>
  );
}

export function PricingCurrencyNote({ className }: { className?: string }) {
  const { currency, isLocalized } = usePricingLocale();

  if (!isLocalized) {
    return null;
  }

  return (
    <p className={cn("text-center text-[13px] text-[#64748b]", className)}>
      Prices shown in {currency}{" "}
      for convenience. You&apos;ll be charged in USD at checkout.
    </p>
  );
}
