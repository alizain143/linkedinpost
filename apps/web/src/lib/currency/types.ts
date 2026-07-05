export type PricingLocale = {
  country: string;
  currency: string;
  locale: string;
  rates: Record<string, number>;
  isLocalized: boolean;
};
