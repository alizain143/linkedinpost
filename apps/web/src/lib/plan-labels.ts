import type { UserPlan } from "@/lib/api/types/enums";

const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export function getPlanLabel(plan: UserPlan): string {
  return PLAN_LABELS[plan] ?? plan;
}
