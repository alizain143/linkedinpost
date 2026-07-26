import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "About linkedinpost.ai";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function AboutOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "About",
    headline: "Fixing the blank page for people with something to say.",
    subline: "Built for professionals who refuse to sound like generic AI.",
  });
}
