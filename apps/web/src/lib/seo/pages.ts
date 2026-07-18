/** Indexable marketing routes for sitemap generation. */
export const MARKETING_PAGES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/features", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/pricing", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/guides", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.75 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
] as const;
