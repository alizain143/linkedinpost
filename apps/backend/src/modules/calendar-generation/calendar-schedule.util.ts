import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_TIMEZONE,
  getLocalDateParts,
  getTodayDateKey,
  toLocalDateKey,
} from '../calendar/calendar-date.util';

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_POSTING_TIME = '09:00';
export const DEFAULT_POSTING_DAYS = [1, 2, 3, 4, 5] as const;

const WEEKDAY_TO_ISO: Record<string, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7,
};

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

export function addDaysToDateKey(
  dateKey: string,
  days: number,
  timezone: string,
): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const anchor = utcDateFromLocalParts(year, month, day, timezone);
  return toLocalDateKey(new Date(anchor.getTime() + days * DAY_MS), timezone);
}

export function getIsoWeekdayFromDateKey(
  dateKey: string,
  timezone: string,
): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const anchor = utcDateFromLocalParts(year, month, day, timezone);
  const weekday = getLocalDateParts(anchor, timezone).weekday;
  return WEEKDAY_TO_ISO[weekday] ?? 1;
}

export function resolveStartDateKey(
  startDate: string | undefined,
  timezone: string,
  now = new Date(),
): string {
  if (startDate) {
    return startDate;
  }

  return addDaysToDateKey(getTodayDateKey(timezone, now), 1, timezone);
}

export function buildCalendarSlotDates(
  slotCount: number,
  startDateKey: string,
  postingDays: number[],
  timezone: string,
): string[] {
  const allowed = new Set(postingDays);
  const dates: string[] = [];
  let cursor = startDateKey;
  let guard = 0;
  const maxIterations = slotCount * 14;

  while (dates.length < slotCount && guard < maxIterations) {
    const weekday = getIsoWeekdayFromDateKey(cursor, timezone);
    if (allowed.has(weekday)) {
      dates.push(cursor);
    }
    cursor = addDaysToDateKey(cursor, 1, timezone);
    guard++;
  }

  if (dates.length < slotCount) {
    throw new BadRequestException({
      error: 'Could not build enough calendar slots for postingDays',
      code: 'CALENDAR_SLOT_PLAN_FAILED',
    });
  }

  return dates;
}

export function localDateTimeToUtc(
  dateKey: string,
  time: string,
  timezone: string,
): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    throw new BadRequestException({
      error: 'Invalid date or posting time',
      code: 'VALIDATION_ERROR',
    });
  }

  let guess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone || DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  for (let attempt = 0; attempt < 72; attempt++) {
    const parts = formatter.formatToParts(new Date(guess));
    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value ?? '0');

    const localYear = pick('year');
    const localMonth = pick('month');
    const localDay = pick('day');
    const localHour = pick('hour');
    const localMinute = pick('minute');

    if (
      localYear === year &&
      localMonth === month &&
      localDay === day &&
      localHour === hour &&
      localMinute === minute
    ) {
      return new Date(guess);
    }

    const targetMinutes = hour * 60 + minute;
    const actualMinutes = localHour * 60 + localMinute;
    let deltaMinutes = targetMinutes - actualMinutes;

    if (localDay !== day) {
      deltaMinutes += (day - localDay) * 24 * 60;
    }

    guess += deltaMinutes * 60 * 1000;
  }

  throw new BadRequestException({
    error: 'Could not resolve posting time in user timezone',
    code: 'VALIDATION_ERROR',
  });
}

export function calendarCreditCost(
  durationDays: 7 | 30,
  mode: 'quick_draft' | 'council' = 'quick_draft',
): number {
  const perSlot = mode === 'council' ? 3 : 1;
  return calendarSlotCount(durationDays) * perSlot;
}

export function calendarSlotCount(durationDays: 7 | 30): number {
  return durationDays;
}
