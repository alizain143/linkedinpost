import type { UserPlan } from "@/lib/api/types/enums";

export type OfferBonus = {
  id: string;
  title: string;
  description: string;
  href: string;
  /** Plans that include this bonus */
  plans: readonly UserPlan[];
};

/** Real deliverables linked from pricing / billing / resources. */
export const OFFER_BONUSES: OfferBonus[] = [
  {
    id: "pillar-calendar-template",
    title: "First-30-days pillar calendar template",
    description:
      "A practical month layout so you ship pillars without staring at a blank calendar.",
    href: "/guides/linkedin-content-calendar-template",
    plans: ["pro", "agency"],
  },
  {
    id: "hook-formulas",
    title: "Hook formulas pack",
    description:
      "Opening lines that earn the expand, tuned for founder and operator posts.",
    href: "/guides/linkedin-hooks-that-get-engagement",
    plans: ["pro", "agency"],
  },
  {
    id: "client-onboarding",
    title: "Client onboarding checklist",
    description:
      "Voice, LinkedIn connect, pillars, and first approvals for a new client workspace.",
    href: "/app/resources/client-onboarding",
    plans: ["agency"],
  },
  {
    id: "approval-sop",
    title: "Approval workflow SOP",
    description:
      "How to send share links, collect feedback, and publish without voice bleed.",
    href: "/app/resources/approval-workflow",
    plans: ["agency"],
  },
];

export const VOICE_GUARANTEE_COPY =
  "7-day voice guarantee on your first paid plan";

export const VOICE_GUARANTEE_DETAIL =
  "If you set a content profile, use the product, and drafts still feel generic within 7 days of your first Pro or Agency charge, email support@linkedinpost.ai for a full refund of that first charge. Credit top-ups alone are not covered.";

export function bonusesForPlan(plan: UserPlan): OfferBonus[] {
  return OFFER_BONUSES.filter((bonus) =>
    (bonus.plans as readonly string[]).includes(plan),
  );
}

export function bonusLinesForPlan(plan: UserPlan): string[] {
  return bonusesForPlan(plan).map((bonus) => `Bonus: ${bonus.title}`);
}
