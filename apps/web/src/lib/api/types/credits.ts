import type { UserPlan } from "@/lib/api/types/enums";

export type ApiCreditsBalance = {
  plan: UserPlan;
  periodStart: string;
  periodEnd: string;
  used: number;
  limit: number;
  purchased: number;
  remaining: number;
  percentUsed: number;
};
