import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "LinkedIn Text Formatter";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function LinkedInTextFormatterOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Free tool",
    headline: "Format LinkedIn text with bold, italic, and bullets.",
    subline: "Unicode styling in your browser. Copy, paste, no signup.",
  });
}
