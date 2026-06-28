import {
  computeNextRunAt,
  derivePostingPresetLabel,
  isDueNow,
  nextPillarIndex,
  parsePostingHour,
  POSTING_PRESET_DAYS,
  resolvePostingDaysForPreset,
  resolveTopicFromPillar,
} from './autopilot-schedule.util';

describe('autopilot-schedule.util', () => {
  const timezone = 'America/New_York';

  describe('posting presets', () => {
    it('maps three_per_week to Mon Wed Thu Fri Sun', () => {
      expect(resolvePostingDaysForPreset('three_per_week')).toEqual([
        1, 3, 4, 5, 7,
      ]);
    });

    it('maps daily to all weekdays', () => {
      expect(POSTING_PRESET_DAYS.daily).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('derives preset label from posting days', () => {
      expect(derivePostingPresetLabel([1, 2, 3, 4, 5])).toBe('weekdays');
      expect(derivePostingPresetLabel([1, 2])).toBe('custom');
    });
  });

  describe('isDueNow', () => {
    const baseConfig = {
      enabled: true,
      postingDays: [5],
      postingTime: '09:00',
      lastRunDateKey: null,
    };

    it('returns false when disabled', () => {
      const now = new Date('2026-06-26T13:00:00.000Z');
      expect(
        isDueNow({ ...baseConfig, enabled: false }, timezone, now),
      ).toBe(false);
    });

    it('returns false when already ran today', () => {
      const now = new Date('2026-06-26T13:00:00.000Z');
      expect(
        isDueNow(
          { ...baseConfig, lastRunDateKey: '2026-06-26' },
          timezone,
          now,
        ),
      ).toBe(false);
    });

    it('returns true on posting day at matching hour', () => {
      const now = new Date('2026-06-26T13:00:00.000Z');
      expect(isDueNow(baseConfig, timezone, now)).toBe(true);
    });

    it('returns false on wrong hour', () => {
      const now = new Date('2026-06-26T14:00:00.000Z');
      expect(isDueNow(baseConfig, timezone, now)).toBe(false);
    });
  });

  describe('computeNextRunAt', () => {
    it('returns the next posting slot in the future', () => {
      const now = new Date('2026-06-26T14:00:00.000Z');
      const next = computeNextRunAt([5], '09:00', timezone, now);
      expect(next).not.toBeNull();
      expect(next!.toISOString()).toBe('2026-07-03T13:00:00.000Z');
    });
  });

  describe('helpers', () => {
    it('parses posting hour', () => {
      expect(parsePostingHour('09:30')).toBe(9);
    });

    it('builds topic from pillar', () => {
      expect(resolveTopicFromPillar('Founder lessons')).toBe(
        'Insights on Founder lessons',
      );
    });

    it('rotates pillar index', () => {
      expect(nextPillarIndex(2, 3)).toBe(0);
    });
  });
});
