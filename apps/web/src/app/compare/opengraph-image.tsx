import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "Compare linkedinpost.ai with other LinkedIn tools";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function CompareHubOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Compare",
    headline: "linkedinpost.ai vs the tools you already know.",
    subline: "Side-by-side with Taplio, Buffer, and AuthoredUp.",
  });
}
