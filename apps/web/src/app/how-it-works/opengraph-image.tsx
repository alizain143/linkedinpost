import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "How linkedinpost.ai works";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function HowItWorksOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "How it works",
    headline: "From blank page to a publishing system in four steps.",
    subline: "Voice profile, AI Council, media review, then approve and ship.",
  });
}
