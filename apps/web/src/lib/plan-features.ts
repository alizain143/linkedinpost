import type { UserPlan } from "@/lib/api/types/enums";

/** Mirrors backend plan-features.constants.ts */
export const PLAN_FEATURES = {
  client_workspaces: ["agency"],
  approval_share_links: ["agency"],
} as const;

export type PlanFeature = keyof typeof PLAN_FEATURES;

export function planAllowsFeature(
  plan: UserPlan,
  feature: PlanFeature,
): boolean {
  return (PLAN_FEATURES[feature] as readonly UserPlan[]).includes(plan);
}

export function getPlanFeatures(plan: UserPlan): PlanFeature[] {
  return (Object.keys(PLAN_FEATURES) as PlanFeature[]).filter((feature) =>
    planAllowsFeature(plan, feature),
  );
}

export function newlyUnlockedFeatures(
  from: UserPlan | null | undefined,
  to: UserPlan,
): PlanFeature[] {
  const previous = new Set(from ? getPlanFeatures(from) : []);
  return getPlanFeatures(to).filter((feature) => !previous.has(feature));
}

export const PLAN_FEATURE_COPY: Record<
  PlanFeature,
  { title: string; description: string; href: string }
> = {
  client_workspaces: {
    title: "Client workspaces",
    description: "Manage LinkedIn accounts for clients in one place.",
    href: "/app/clients",
  },
  approval_share_links: {
    title: "Approval share links",
    description: "Send clients a link to review and approve posts.",
    href: "/app/approvals",
  },
};

export function unlockTourIdForPlan(plan: UserPlan): string | null {
  if (plan === "agency") return "agency-unlock-v1";
  return null;
}
