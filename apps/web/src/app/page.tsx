import type { Metadata } from "next";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { PricingLocaleProvider } from "@/components/pricing/pricing-locale-provider";
import { FaqPageJsonLd } from "@/components/seo/json-ld";
import { HeroSection, TrustBar } from "@/components/sections/landing/hero-section";
import {
  FaqSection,
  FeaturesSection,
  FinalCtaSection,
  HowItWorksSection,
  PricingSection,
  ProblemSection,
  StatsBand,
  TestimonialsSection,
} from "@/components/sections/landing/landing-sections";
import { getPricingLocale } from "@/lib/currency/server";
import { SITE_DESCRIPTION, SITE_TITLE_DEFAULT } from "@/lib/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: SITE_TITLE_DEFAULT,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const pricingLocale = await getPricingLocale();

  return (
    <PricingLocaleProvider value={pricingLocale}>
      <MarketingLayout>
        <FaqPageJsonLd />
        <HeroSection />
        <TrustBar />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <StatsBand />
        <TestimonialsSection />
        <FaqSection />
        <FinalCtaSection />
      </MarketingLayout>
    </PricingLocaleProvider>
  );
}
