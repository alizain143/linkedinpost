import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderMarketingOgImage,
} from "@/lib/seo/og-image";
import { getCaseStudyBySlug } from "@/lib/seo/acquisition-pages";

export const alt = "linkedinpost.ai case study";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

type Props = { params: Promise<{ slug: string }> };

export default async function CaseStudyOpenGraphImage({ params }: Props) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);

  return renderMarketingOgImage({
    eyebrow: "Case study",
    headline: study?.title ?? "linkedinpost.ai case study",
    subline: study?.summary,
  });
}
