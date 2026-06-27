import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const ROUTES = [
  "",
  "/features",
  "/how-it-works",
  "/pricing",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().origin;
  const now = new Date();

  return ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
