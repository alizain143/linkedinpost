import { PostType } from '@prisma/client';
import { CalendarPlannerOutputParser } from './parsers/calendar-planner-output.parser';
import {
  buildCalendarSlotDates,
  calendarCreditCost,
  calendarSlotCount,
  getIsoWeekdayFromDateKey,
  localDateTimeToUtc,
  resolveStartDateKey,
} from './calendar-schedule.util';

describe('calendar-schedule.util', () => {
  const timezone = 'America/New_York';

  it('builds weekday slot dates', () => {
    const dates = buildCalendarSlotDates(5, '2026-06-01', [1, 2, 3, 4, 5], timezone);
    expect(dates).toHaveLength(5);
    expect(dates[0]).toBe('2026-06-01');
    for (const date of dates) {
      expect(getIsoWeekdayFromDateKey(date, timezone)).toBeLessThanOrEqual(5);
    }
  });

  it('maps credit cost by duration and mode', () => {
    expect(calendarCreditCost(7)).toBe(7);
    expect(calendarCreditCost(30)).toBe(30);
    expect(calendarCreditCost(7, 'council')).toBe(21);
    expect(calendarCreditCost(30, 'council')).toBe(90);
    expect(calendarSlotCount(7)).toBe(7);
    expect(calendarSlotCount(30)).toBe(30);
  });

  it('resolves start date to tomorrow when omitted', () => {
    const start = resolveStartDateKey(
      undefined,
      timezone,
      new Date('2026-06-15T15:00:00.000Z'),
    );
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('converts local date and time to UTC', () => {
    const utc = localDateTimeToUtc('2026-07-01', '09:00', timezone);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(utc);
    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value;

    expect(pick('year')).toBe('2026');
    expect(pick('month')).toBe('07');
    expect(pick('day')).toBe('01');
    expect(pick('hour')).toBe('09');
    expect(pick('minute')).toBe('00');
  });
});

describe('CalendarPlannerOutputParser', () => {
  const parser = new CalendarPlannerOutputParser();

  it('parses planner slots and normalizes dates', () => {
    const expectedDates = ['2026-07-01', '2026-07-02'];
    const result = parser.parse(
      JSON.stringify({
        slots: [
          {
            date: '2026-07-01',
            topic: 'Topic A',
            pillar: 'Lessons',
            postType: PostType.personal_story,
            tone: 'Direct',
          },
          {
            date: '2026-07-02',
            topic: 'Topic B',
            pillar: 'Lessons',
            postType: PostType.list_post,
            tone: 'Bold',
          },
        ],
      }),
      expectedDates,
    );

    expect(result.slots).toHaveLength(2);
    expect(result.slots[0].topic).toBe('Topic A');
    expect(result.slots[1].date).toBe('2026-07-02');
  });

  it('rejects wrong slot count', () => {
    expect(() =>
      parser.parse(
        JSON.stringify({
          slots: [
            {
              date: '2026-07-01',
              topic: 'Only one',
              pillar: 'Lessons',
              postType: PostType.personal_story,
              tone: 'Direct',
            },
          ],
        }),
        ['2026-07-01', '2026-07-02'],
      ),
    ).toThrow();
  });
});
