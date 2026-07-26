import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";

export const alt = "LinkedIn content guides";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function GuidesHubOpenGraphImage() {
  return renderMarketingOgImage({
    eyebrow: "Guides",
    headline: "LinkedIn content advice, said clearly.",
    subline: "Cadence, calendars, hooks, and keeping AI drafts human.",
  });
}
