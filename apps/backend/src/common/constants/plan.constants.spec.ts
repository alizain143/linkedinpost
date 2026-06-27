import { UserPlan } from '@prisma/client';
import {
  getCreditLimitForPlan,
  PLAN_CREDIT_LIMITS,
} from './plan.constants';

describe('plan.constants', () => {
  describe('PLAN_CREDIT_LIMITS', () => {
    it('defines limits for every plan tier', () => {
      for (const plan of Object.values(UserPlan)) {
        expect(PLAN_CREDIT_LIMITS[plan]).toBeGreaterThan(0);
      }
    });
  });

  describe('getCreditLimitForPlan', () => {
    it('returns mapped limit', () => {
      expect(getCreditLimitForPlan(UserPlan.free)).toBe(5);
      expect(getCreditLimitForPlan(UserPlan.pro)).toBe(200);
      expect(getCreditLimitForPlan(UserPlan.agency)).toBe(1000);
    });
  });
});
