import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "LinkedIn tool alternatives";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function AlternativesOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Alternatives",
    headline: "Taplio, Buffer, and AuthoredUp alternatives for LinkedIn.",
    subline: "When to switch, when to stay, and what linkedinpost.ai is built for.",
  });
}
