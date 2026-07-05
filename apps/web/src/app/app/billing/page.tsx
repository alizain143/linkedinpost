import { Billing } from "@/components/sections/app/billing";
import { PricingLocaleProvider } from "@/components/pricing/pricing-locale-provider";
import { getPricingLocale } from "@/lib/currency/server";

export default async function BillingPage() {
  const pricingLocale = await getPricingLocale();

  return (
    <PricingLocaleProvider value={pricingLocale}>
      <Billing />
    </PricingLocaleProvider>
  );
}
