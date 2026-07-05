"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_PRICING_LOCALE, localizeUsdPrice } from "@/lib/currency";
import type { PricingLocale } from "@/lib/currency/types";

type PricingLocaleContextValue = PricingLocale & {
  formatPrice: (amountUsd: number) => string;
};

const PricingLocaleContext = createContext<PricingLocaleContextValue>({
  ...DEFAULT_PRICING_LOCALE,
  formatPrice: (amountUsd) => localizeUsdPrice(amountUsd, DEFAULT_PRICING_LOCALE),
});

export function PricingLocaleProvider({
  value,
  children,
}: {
  value: PricingLocale;
  children: React.ReactNode;
}) {
  const contextValue = useMemo(
    () => ({
      ...value,
      formatPrice: (amountUsd: number) => localizeUsdPrice(amountUsd, value),
    }),
    [value],
  );

  return (
    <PricingLocaleContext.Provider value={contextValue}>
      {children}
    </PricingLocaleContext.Provider>
  );
}

export function usePricingLocale() {
  return useContext(PricingLocaleContext);
}
