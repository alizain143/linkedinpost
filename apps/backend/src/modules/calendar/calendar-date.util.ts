export const DEFAULT_TIMEZONE = 'America/New_York';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CalendarCellDate {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

export interface CalendarWeekDay {
  date: string;
  dayOfWeek: string;
  day: number;
}

const dateKeyFormatterCache = new Map<string, Intl.DateTimeFormat>();
const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateKeyFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = dateKeyFormatterCache.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateKeyFormatterCache.set(timezone, formatter);
  }
  return formatter;
}

function getPartsFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = partsFormatterCache.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    partsFormatterCache.set(timezone, formatter);
  }
  return formatter;
}

export function toLocalDateKey(instant: Date, timezone: string): string {
  return getDateKeyFormatter(timezone).format(instant);
}

export function getLocalDateParts(instant: Date, timezone: string) {
  const parts = getPartsFormatter(timezone).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  return {
    year: Number(pick('year')),
    month: Number(pick('month')),
    day: Number(pick('day')),
    weekday: pick('weekday').replace(/\./g, '').toUpperCase().slice(0, 3),
  };
}

function utcDateFromLocalParts(
  year: number,
  month: number,
  day: number,
  timezone: string,
): Date {
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const parts = getLocalDateParts(utcMidnight, timezone);
  const dayOffset = day - parts.day;
  const monthOffset = month - parts.month;
  const yearOffset = year - parts.year;

  return new Date(
    Date.UTC(
      year - yearOffset,
      month - 1 - monthOffset,
      day - dayOffset,
      12,
      0,
      0,
      0,
    ),
  );
}

function addDaysToLocalDateKey(
  dateKey: string,
  days: number,
  timezone: string,
): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const anchor = utcDateFromLocalParts(year, month, day, timezone);
  return toLocalDateKey(new Date(anchor.getTime() + days * DAY_MS), timezone);
}

export function getTodayDateKey(timezone: string, now = new Date()): string {
  return toLocalDateKey(now, timezone);
}

export function getMonthGrid(
  anchorDate: Date,
  timezone: string,
  now = new Date(),
): { year: number; month: number; cells: CalendarCellDate[] } {
  const anchorParts = getLocalDateParts(anchorDate, timezone);
  const year = anchorParts.year;
  const month = anchorParts.month;
  const todayKey = getTodayDateKey(timezone, now);

  const firstOfMonthKey = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const firstWeekday = getLocalDateParts(
    utcDateFromLocalParts(year, month, 1, timezone),
    timezone,
  ).weekday;

  const weekdayIndex: Record<string, number> = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6,
  };

  const leadingDays = weekdayIndex[firstWeekday] ?? 0;
  const gridStartKey = addDaysToLocalDateKey(firstOfMonthKey, -leadingDays, timezone);

  const cells: CalendarCellDate[] = [];
  let cursorKey = gridStartKey;

  while (cells.length < 42) {
    const [y, m, d] = cursorKey.split('-').map(Number);
    cells.push({
      date: cursorKey,
      day: d,
      inMonth: y === year && m === month,
      isToday: cursorKey === todayKey,
    });
    cursorKey = addDaysToLocalDateKey(cursorKey, 1, timezone);
  }

  return { year, month, cells };
}

export function getWeekRange(
  anchorDate: Date,
  timezone: string,
): { startDate: string; endDate: string; days: CalendarWeekDay[] } {
  const anchorKey = toLocalDateKey(anchorDate, timezone);
  const anchorParts = getLocalDateParts(anchorDate, timezone);
  const weekdayIndex: Record<string, number> = {
    MON: 0,
    TUE: 1,
    WED: 2,
    THU: 3,
    FRI: 4,
    SAT: 5,
    SUN: 6,
  };

  const offset = weekdayIndex[anchorParts.weekday] ?? 0;
  const startKey = addDaysToLocalDateKey(anchorKey, -offset, timezone);

  const days: CalendarWeekDay[] = [];
  let cursorKey = startKey;

  for (let i = 0; i < 7; i += 1) {
    const [y, m, d] = cursorKey.split('-').map(Number);
    const parts = getLocalDateParts(
      utcDateFromLocalParts(y, m, d, timezone),
      timezone,
    );
    days.push({
      date: cursorKey,
      dayOfWeek: parts.weekday,
      day: d,
    });
    cursorKey = addDaysToLocalDateKey(cursorKey, 1, timezone);
  }

  return {
    startDate: days[0].date,
    endDate: days[6].date,
    days,
  };
}

export function getListRange(
  anchorDate: Date,
  timezone: string,
): { rangeStart: Date; rangeEnd: Date } {
  const anchorKey = toLocalDateKey(anchorDate, timezone);
  const startKey = addDaysToLocalDateKey(anchorKey, -7, timezone);
  const endKey = addDaysToLocalDateKey(anchorKey, 30, timezone);

  const [startYear, startMonth, startDay] = startKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = endKey.split('-').map(Number);

  const rangeStart = localStartOfDayUtc(startYear, startMonth, startDay, timezone);
  const rangeEnd = localEndOfDayUtc(endYear, endMonth, endDay, timezone);

  return { rangeStart, rangeEnd };
}

export function getMonthQueryRange(
  year: number,
  month: number,
  timezone: string,
): { rangeStart: Date; rangeEnd: Date } {
  const firstKey = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const lastKey = addDaysToLocalDateKey(
    `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`,
    -1,
    timezone,
  );

  const [startYear, startMonth, startDay] = firstKey.split('-').map(Number);
  const [endYear, endMonth, endDay] = lastKey.split('-').map(Number);

  return {
    rangeStart: localStartOfDayUtc(startYear, startMonth, startDay, timezone),
    rangeEnd: localEndOfDayUtc(endYear, endMonth, endDay, timezone),
  };
}

export function getWeekQueryRange(
  startDate: string,
  endDate: string,
  timezone: string,
): { rangeStart: Date; rangeEnd: Date } {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

  return {
    rangeStart: localStartOfDayUtc(startYear, startMonth, startDay, timezone),
    rangeEnd: localEndOfDayUtc(endYear, endMonth, endDay, timezone),
  };
}

function localStartOfDayUtc(
  year: number,
  month: number,
  day: number,
  timezone: string,
): Date {
  const noonUtc = utcDateFromLocalParts(year, month, day, timezone);
  const key = toLocalDateKey(noonUtc, timezone);
  const [y, m, d] = key.split('-').map(Number);

  for (let hour = 0; hour < 48; hour += 1) {
    const candidate = new Date(Date.UTC(y, m - 1, d, hour, 0, 0, 0));
    if (toLocalDateKey(candidate, timezone) === key) {
      return candidate;
    }
  }

  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function localEndOfDayUtc(
  year: number,
  month: number,
  day: number,
  timezone: string,
): Date {
  const start = localStartOfDayUtc(year, month, day, timezone);
  const nextDayKey = addDaysToLocalDateKey(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    1,
    timezone,
  );
  const [y, m, d] = nextDayKey.split('-').map(Number);
  const nextStart = localStartOfDayUtc(y, m, d, timezone);
  return new Date(nextStart.getTime() - 1);
}

export function widenQueryRange(rangeStart: Date, rangeEnd: Date) {
  return {
    rangeStart: new Date(rangeStart.getTime() - DAY_MS),
    rangeEnd: new Date(rangeEnd.getTime() + DAY_MS),
  };
}
