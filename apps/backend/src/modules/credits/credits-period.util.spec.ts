import { getUtcMonthPeriod } from './credits-period.util';

describe('credits-period.util', () => {
  it('returns UTC month start and end for a given instant', () => {
    const now = new Date('2026-06-27T15:30:00.000Z');
    const { periodStart, periodEnd } = getUtcMonthPeriod(now);

    expect(periodStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    expect(periodEnd.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});
