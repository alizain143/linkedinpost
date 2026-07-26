import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "Contact linkedinpost.ai";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function ContactOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Contact",
    headline: "Support, partnerships, and agency questions.",
    subline: "We usually reply within one business day.",
  });
}
