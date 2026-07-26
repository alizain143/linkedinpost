export type GuideSlug =
  | "linkedin-posts-dont-sound-like-ai"
  | "linkedin-content-calendar-template"
  | "linkedin-posting-frequency-founders"
  | "linkedin-hooks-that-get-engagement"
  | "linkedin-algorithm-what-actually-matters"
  | "linkedin-carousels-that-get-saved"
  | "linkedin-personal-brand-for-founders"
  | "linkedin-content-workflow-for-agencies";

export type Guide = {
  slug: GuideSlug;
  title: string;
  seoTitle?: string;
  description: string;
  seoDescription?: string;
  answerCapsule: string;
  publishedAt: string;
  updatedAt: string;
  relatedGuides: GuideSlug[];
  sections: { heading: string; body: string }[];
  faqs?: { q: string; a: string }[];
};
