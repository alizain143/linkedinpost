import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "linkedinpost.ai features";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function FeaturesOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Features",
    headline: "Everything you need to post on LinkedIn consistently.",
    subline: "AI Council, content calendar, media generator, and agency workspaces.",
  });
}
