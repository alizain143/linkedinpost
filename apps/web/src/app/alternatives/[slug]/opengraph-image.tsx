import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { getAlternativeBySlug } from "@/lib/seo/alternatives";

export const alt = "linkedinpost.ai alternative";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export default async function AlternativeOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const page = getAlternativeBySlug(slug);

  return renderMarketingOgImage({
    eyebrow: "Alternative",
    headline: page?.h1 ?? "LinkedIn tool alternatives",
    subline: page?.description,
  });
}
