import { cookies, headers } from "next/headers";
import { currencyForCountry, localeForCountry } from "@/lib/currency/countries";
import { localizeUsdPrice } from "@/lib/currency/format";
import { getExchangeRates } from "@/lib/currency/rates";
import type { PricingLocale } from "@/lib/currency/types";

const COUNTRY_COOKIE = "lp-country";

export async function getViewerCountry(): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(COUNTRY_COOKIE)?.value;
  if (fromCookie) {
    return fromCookie.toUpperCase();
  }

  const headerStore = await headers();
  const fromHeader =
    headerStore.get("x-vercel-ip-country") ??
    headerStore.get("cf-ipcountry") ??
    "US";

  return fromHeader.toUpperCase();
}

export async function getPricingLocale(): Promise<PricingLocale> {
  const country = await getViewerCountry();
  const currency = currencyForCountry(country);
  const locale = localeForCountry(country);
  const rates = await getExchangeRates();

  return {
    country,
    currency,
    locale,
    rates,
    isLocalized: currency !== "USD",
  };
}

export async function formatLocalizedUsdPrice(amountUsd: number): Promise<string> {
  const ctx = await getPricingLocale();
  return localizeUsdPrice(amountUsd, ctx);
}
