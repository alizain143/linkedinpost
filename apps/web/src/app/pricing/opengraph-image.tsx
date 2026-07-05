import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "linkedinpost.ai pricing plans";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function PricingOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Pricing",
    headline: "Simple plans that scale with your output.",
    subline: "Start free. Upgrade when you're ready for the content calendar.",
  });
}
