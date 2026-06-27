import { UserPlan } from '@prisma/client';

export const PLAN_CREDIT_LIMITS: Record<UserPlan, number> = {
  [UserPlan.free]: 5,
  [UserPlan.starter]: 50,
  [UserPlan.pro]: 200,
  [UserPlan.agency]: 1000,
};

export function getCreditLimitForPlan(plan: UserPlan): number {
  return PLAN_CREDIT_LIMITS[plan];
}

export const AGENCY_MAX_CLIENT_WORKSPACES = 5;
