import type { PricingLocale } from "@/lib/currency/types";

export function convertFromUsd(
  amountUsd: number,
  currency: string,
  rates: Record<string, number>,
): number {
  if (currency === "USD") {
    return amountUsd;
  }

  const rate = rates[currency];
  if (!rate) {
    return amountUsd;
  }

  return amountUsd * rate;
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: string,
): string {
  const fractionDigits =
    currency === "JPY" || currency === "KRW" || currency === "VND" ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: amount === 0 ? 0 : fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatUsdPrice(amountUsd: number): string {
  return formatMoney(amountUsd, "USD", "en-US");
}

export function localizeUsdPrice(amountUsd: number, ctx: PricingLocale): string {
  const converted = convertFromUsd(amountUsd, ctx.currency, ctx.rates);
  return formatMoney(converted, ctx.currency, ctx.locale);
}
