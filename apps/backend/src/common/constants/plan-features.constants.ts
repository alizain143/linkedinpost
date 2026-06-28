import { UserPlan } from '@prisma/client';

export const PLAN_FEATURES = {
  autopilot: [UserPlan.pro, UserPlan.agency],
  calendar_30_day: [UserPlan.pro, UserPlan.agency],
  client_workspaces: [UserPlan.agency],
  approval_share_links: [UserPlan.agency],
} as const;

export type PlanFeature = keyof typeof PLAN_FEATURES;

export function planAllowsFeature(
  plan: UserPlan,
  feature: PlanFeature,
): boolean {
  return (PLAN_FEATURES[feature] as readonly UserPlan[]).includes(plan);
}
