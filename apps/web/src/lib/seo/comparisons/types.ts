/** Shared shapes for long-form comparison and alternative pages. */

export type ComparisonSlug = "taplio" | "buffer" | "authoredup";

export type ComparisonPage = {
  slug: ComparisonSlug;
  competitorName: string;
  title: string;
  h1: string;
  seoTitle: string;
  description: string;
  answerCapsule: string;
  quickVerdict: { criterion: string; winner: string; note: string }[];
  differences: { label: string; us: string; them: string }[];
  pricing: {
    verifiedAsOf: string;
    usSummary: string;
    themSummary: string;
    note: string;
  };
  chooseUs: string[];
  chooseThem: string[];
  migration: { heading: string; body: string }[];
  sections: { heading: string; body: string }[];
  whoWinsWhen: { when: string; pick: string }[];
  faqs: { q: string; a: string }[];
  relatedGuideSlugs: string[];
  alternativePath: string;
};

export type AlternativePage = {
  slug: ComparisonSlug;
  competitorName: string;
  title: string;
  h1: string;
  seoTitle: string;
  description: string;
  answerCapsule: string;
  whyLook: { heading: string; body: string }[];
  whatYouGet: string[];
  whenStay: string[];
  whenSwitch: string[];
  sections: { heading: string; body: string }[];
  faqs: { q: string; a: string }[];
  comparePath: string;
  relatedGuideSlugs: string[];
};
