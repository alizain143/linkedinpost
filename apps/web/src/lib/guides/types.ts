export type GuideSlug =
  | "linkedin-posts-dont-sound-like-ai"
  | "linkedin-content-calendar-template"
  | "linkedin-posting-frequency-founders"
  | "linkedin-hooks-that-get-engagement";

export type Guide = {
  slug: GuideSlug;
  title: string;
  seoTitle?: string;
  description: string;
  seoDescription?: string;
  answerCapsule: string;
  updatedAt: string;
  relatedGuides: GuideSlug[];
  sections: { heading: string; body: string }[];
  faqs?: { q: string; a: string }[];
};
