import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { getPersonaBySlug } from "@/lib/seo/acquisition-pages";

export const alt = "LinkedIn content workflow for agencies";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function ForAgenciesOpenGraphImage() {
  const page = getPersonaBySlug("agencies");

  return renderMarketingOgImage({
    eyebrow: "For agencies",
    headline: page?.title ?? "LinkedIn content for agencies",
    subline:
      page?.answerCapsule ??
      "Separate client voices, approvals, and calendars in one place.",
  });
}
