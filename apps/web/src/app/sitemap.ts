import type { MetadataRoute } from "next";
import { getPublishedGuides } from "@/lib/guides/content";
import { MARKETING_PAGES } from "@/lib/seo/pages";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().origin;
  const now = new Date();

  const staticEntries = MARKETING_PAGES.map((page) => ({
    url: `${base}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const guideEntries = getPublishedGuides().map((guide) => ({
    url: `${base}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...guideEntries];
}
