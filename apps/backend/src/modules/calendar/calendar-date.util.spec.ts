import {
  getMonthGrid,
  getTodayDateKey,
  getWeekRange,
  toLocalDateKey,
} from './calendar-date.util';

describe('calendar-date.util', () => {
  describe('toLocalDateKey', () => {
    it('buckets UTC instant by America/New_York local date', () => {
      const instant = new Date('2026-07-02T02:30:00.000Z');
      expect(toLocalDateKey(instant, 'America/New_York')).toBe('2026-07-01');
    });
  });

  describe('getMonthGrid', () => {
    it('returns 42 Monday-start cells for the anchor month', () => {
      const anchor = new Date('2026-06-15T12:00:00.000Z');
      const { year, month, cells } = getMonthGrid(
        anchor,
        'America/New_York',
        new Date('2026-06-27T12:00:00.000Z'),
      );

      expect(year).toBe(2026);
      expect(month).toBe(6);
      expect(cells).toHaveLength(42);
      expect(cells[0].date).toBe('2026-06-01');
      expect(cells[0].inMonth).toBe(true);
      expect(cells.find((c) => c.isToday)?.date).toBe('2026-06-27');
    });

    it('includes leading days from the previous month', () => {
      const anchor = new Date('2026-07-15T12:00:00.000Z');
      const { cells } = getMonthGrid(anchor, 'America/New_York');

      expect(cells[0].inMonth).toBe(false);
      expect(cells.some((c) => c.date === '2026-07-01' && c.inMonth)).toBe(true);
    });
  });

  describe('getWeekRange', () => {
    it('returns Mon–Sun week containing the anchor date', () => {
      const anchor = new Date('2026-06-27T12:00:00.000Z');
      const week = getWeekRange(anchor, 'America/New_York');

      expect(week.startDate).toBe('2026-06-22');
      expect(week.endDate).toBe('2026-06-28');
      expect(week.days).toHaveLength(7);
      expect(week.days[0]).toEqual({
        date: '2026-06-22',
        dayOfWeek: 'MON',
        day: 22,
      });
      expect(week.days[6].date).toBe('2026-06-28');
    });
  });

  describe('getTodayDateKey', () => {
    it('uses the provided timezone for today', () => {
      const now = new Date('2026-06-27T12:00:00.000Z');
      expect(getTodayDateKey('America/New_York', now)).toBe('2026-06-27');
    });
  });
});
