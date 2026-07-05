export { currencyForCountry, localeForCountry } from "@/lib/currency/countries";
export {
  convertFromUsd,
  formatMoney,
  formatUsdPrice,
  localizeUsdPrice,
} from "@/lib/currency/format";
export { getExchangeRates } from "@/lib/currency/rates";
export type { PricingLocale } from "@/lib/currency/types";

export const DEFAULT_PRICING_LOCALE: import("@/lib/currency/types").PricingLocale = {
  country: "US",
  currency: "USD",
  locale: "en-US",
  rates: { USD: 1 },
  isLocalized: false,
};
