import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { getComparisonBySlug } from "@/lib/seo/acquisition-pages";

export const alt = "linkedinpost.ai comparison";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export default async function ComparisonOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const page = getComparisonBySlug(slug);

  return renderMarketingOgImage({
    eyebrow: "Compare",
    headline: page?.title ?? "linkedinpost.ai comparisons",
    subline: page?.description,
  });
}
