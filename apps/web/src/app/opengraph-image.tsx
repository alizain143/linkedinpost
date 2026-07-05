import {
  OG_IMAGE_ALT,
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpenGraphImage() {
  return renderMarketingOgImage({
    headline: SITE_TAGLINE,
    subline: SITE_DESCRIPTION,
  });
}
