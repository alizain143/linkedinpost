import type { Metadata } from "next";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PricingCurrencyNote } from "@/components/pricing/plan-price";
import { PricingLocaleProvider } from "@/components/pricing/pricing-locale-provider";
import {
  BreadcrumbJsonLd,
  FaqPageJsonLd,
  PricingOfferCatalogJsonLd,
} from "@/components/seo/json-ld";
import { CompareTable, PlanCard } from "@/components/sections/marketing/shared";
import { FAQS, PLANS } from "@/lib/marketing-data";
import { getPricingLocale } from "@/lib/currency/server";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Pricing | linkedinpost.ai",
  description:
    "Simple plans that scale with your output. Start free, upgrade when you're ready for more volume and the content calendar.",
  path: "/pricing",
  openGraphImage: "/pricing/opengraph-image",
  openGraphImageAlt: "linkedinpost.ai pricing plans",
});

export default async function PricingPage() {
  const pricingLocale = await getPricingLocale();

  return (
    <PricingLocaleProvider value={pricingLocale}>
      <MarketingLayout>
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]}
        />
        <PricingOfferCatalogJsonLd />
        <FaqPageJsonLd />
        <section className="bg-[radial-gradient(120%_100%_at_50%_-10%,#eef0ff_0%,#f6f7f9_52%)]">
          <div className="mx-auto max-w-[920px] px-7 pb-10 pt-[66px] text-center">
            <div className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-[#6366f1]">
              Pricing
            </div>
            <h1 className="pp-hero-h1 font-display text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0d1326]">
              Simple plans that scale with your output.
            </h1>
            <p className="mx-auto mt-5 max-w-[520px] text-lg leading-[1.55] text-[#5a667a]">
              Start free. Upgrade when you&apos;re ready for more volume and the
              content calendar.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-7 pb-6 pt-2">
          <div className="pp-grid4 items-start">
            {PLANS.map((plan) => (
              <PlanCard key={plan.name} {...plan} />
            ))}
          </div>
          <PricingCurrencyNote className="mt-5" />
        </section>

        <section className="mx-auto max-w-[1100px] px-7 py-10">
          <h2 className="mb-7 text-center font-display text-[26px] font-extrabold tracking-[-0.02em]">
            Compare every plan
          </h2>
          <CompareTable />
        </section>

        <section className="mx-auto max-w-[880px] px-7 pb-16 pt-6">
          <h2 className="mb-7 text-center font-display text-[26px] font-extrabold tracking-[-0.02em]">
            Pricing questions
          </h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="rounded-[14px] border border-[#eceef4] bg-white px-[22px] py-5"
              >
                <h3 className="font-display text-[15.5px] font-bold">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-[1.6] text-[#64748b]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </MarketingLayout>
    </PricingLocaleProvider>
  );
}
