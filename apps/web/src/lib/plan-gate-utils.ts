import type { UserPlan } from "@/lib/api/types/enums";
import type { ApiCreditsBalance } from "@/lib/api/types/credits";

export type PlanGateStatus = "loading" | "error" | "ready";

export function getPlanGateState(input: {
  isLoading: boolean;
  isError: boolean;
  balance: ApiCreditsBalance | undefined;
}): { status: PlanGateStatus; plan: UserPlan | null } {
  if (input.isLoading) {
    return { status: "loading", plan: null };
  }

  if (input.isError || !input.balance) {
    return { status: "error", plan: null };
  }

  return { status: "ready", plan: input.balance.plan };
}
