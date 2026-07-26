import { getSiteUrl, LINKEDIN_COMPANY_URL, TWITTER_URL } from "@/lib/site";

export type AuthorId = "content-team";

export type Author = {
  id: AuthorId;
  slug: string;
  name: string;
  jobTitle: string;
  /** One-line credential for bylines. */
  description: string;
  /** Longer bio for the author page. */
  bio: string[];
  sameAs: string[];
};

export const AUTHORS: Record<AuthorId, Author> = {
  "content-team": {
    id: "content-team",
    slug: "linkedinpost-ai-content-team",
    name: "LinkedInPost AI Content Team",
    jobTitle: "Editorial",
    description:
      "The LinkedInPost AI Content Team writes practical LinkedIn guides for founders, creators, and agencies.",
    bio: [
      "The LinkedInPost AI Content Team publishes guides and product education for people who want LinkedIn to work without becoming a full-time creator.",
      "We focus on voice, cadence, hooks, calendars, and keeping AI drafts from sounding generic. The goal is advice you can use in a real week at work, not generic frameworks.",
      "Questions about a guide or the product? Use the contact page. Product updates also appear on our company LinkedIn and X accounts.",
    ],
    sameAs: [LINKEDIN_COMPANY_URL, TWITTER_URL],
  },
} as const;

export const DEFAULT_AUTHOR_ID: AuthorId = "content-team";

export function getAuthorById(id: AuthorId): Author {
  return AUTHORS[id];
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return Object.values(AUTHORS).find((author) => author.slug === slug);
}

export function getAllAuthors(): Author[] {
  return Object.values(AUTHORS);
}

/** Schema.org Organization node used as Article author. */
export function authorSchema(author: Author) {
  const base = getSiteUrl().origin;
  return {
    "@type": "Organization" as const,
    name: author.name,
    url: `${base}/authors/${author.slug}`,
    description: author.description,
    sameAs: author.sameAs,
  };
}
