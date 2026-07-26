import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "Free LinkedIn tools from linkedinpost.ai";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function ToolsOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Tools",
    headline: "Free LinkedIn tools. No signup required.",
    subline: "Character counter and Unicode text formatter for posts.",
  });
}
