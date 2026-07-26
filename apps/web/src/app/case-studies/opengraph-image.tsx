import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "linkedinpost.ai case studies";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function CaseStudiesHubOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Case studies",
    headline: "How the system shows up in real weeks.",
    subline: "Illustrative founder and agency workflows.",
  });
}
