import { SubscriptionStatus } from '@prisma/client';
import {
  getUtcMonthPeriod,
  resolveCreditPeriod,
} from './credits-period.util';

describe('credits-period.util', () => {
  it('returns UTC month start and end for a given instant', () => {
    const now = new Date('2026-06-27T15:30:00.000Z');
    const { periodStart, periodEnd } = getUtcMonthPeriod(now);

    expect(periodStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(periodEnd.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  describe('resolveCreditPeriod', () => {
    it('uses Stripe subscription period for active paid users', () => {
      const periodStart = new Date('2026-01-15T00:00:00.000Z');
      const periodEnd = new Date('2026-02-15T00:00:00.000Z');
      const now = new Date('2026-01-20T00:00:00.000Z');

      const result = resolveCreditPeriod(
        {
          status: SubscriptionStatus.active,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        now,
      );

      expect(result.periodStart).toEqual(periodStart);
      expect(result.periodEnd).toEqual(periodEnd);
    });

    it('falls back to UTC month for free users without subscription', () => {
      const now = new Date('2026-06-27T15:30:00.000Z');
      const result = resolveCreditPeriod(null, now);

      expect(result.periodStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
      expect(result.periodEnd.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    });

    it('falls back to UTC month when subscription period dates are missing', () => {
      const now = new Date('2026-06-27T15:30:00.000Z');
      const result = resolveCreditPeriod(
        {
          status: SubscriptionStatus.active,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
        now,
      );

      expect(result.periodStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
      expect(result.periodEnd.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    });

    it('uses subscription period for past_due grace period', () => {
      const periodStart = new Date('2026-01-15T00:00:00.000Z');
      const periodEnd = new Date('2026-02-15T00:00:00.000Z');

      const result = resolveCreditPeriod({
        status: SubscriptionStatus.past_due,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      expect(result.periodStart).toEqual(periodStart);
      expect(result.periodEnd).toEqual(periodEnd);
    });
  });
});
