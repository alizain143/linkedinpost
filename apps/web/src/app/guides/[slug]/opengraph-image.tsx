import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { getGuideBySlug } from "@/lib/guides/content";

export const alt = "Guide preview image";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export default async function GuideOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  return renderMarketingOgImage({
    eyebrow: "Guide",
    headline: guide?.title ?? "LinkedIn content guide",
    subline: guide?.description,
  });
}
