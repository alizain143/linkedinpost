import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "LinkedIn Character Counter";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function LinkedInCharacterCounterOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Free tool",
    headline: "LinkedIn character counter with see more preview.",
    subline: "Live counts, 1,300-char marker, truncated vs full post view.",
  });
}
