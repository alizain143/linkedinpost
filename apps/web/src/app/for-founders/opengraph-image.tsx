import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { getPersonaBySlug } from "@/lib/seo/acquisition-pages";

export const alt = "LinkedIn content system for founders";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function ForFoundersOpenGraphImage() {
  const page = getPersonaBySlug("founders");

  return renderMarketingOgImage({
    eyebrow: "For founders",
    headline: page?.title ?? "LinkedIn content for founders",
    subline:
      page?.answerCapsule ??
      "A weekly rhythm without sounding like generic AI.",
  });
}
