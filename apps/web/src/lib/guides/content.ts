import { GUIDE_ARTICLES } from "@/lib/guides/articles";
import type { Guide, GuideSlug } from "@/lib/guides/types";

export type { Guide, GuideSlug };

const GUIDES: Guide[] = [...GUIDE_ARTICLES];

export function getPublishedGuides(): Guide[] {
  return GUIDES;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
