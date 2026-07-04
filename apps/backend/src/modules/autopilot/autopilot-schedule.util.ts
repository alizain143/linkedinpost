import { getTodayDateKey } from '../calendar/calendar-date.util';
import {
  addDaysToDateKey,
  getIsoWeekdayFromDateKey,
  localDateTimeToUtc,
} from '../calendar-generation/calendar-schedule.util';

export const AUTOPILOT_CREDIT_COST = 3;
export const DEFAULT_POSTING_TIME = '09:00';
export const DEFAULT_POSTING_DAYS = [1, 3, 4, 5, 7];

export type AutopilotPostingPreset =
  'three_per_week' | 'daily' | 'weekdays' | 'weekly';

export const POSTING_PRESET_DAYS: Record<AutopilotPostingPreset, number[]> = {
  three_per_week: [1, 3, 4, 5, 7],
  daily: [1, 2, 3, 4, 5, 6, 7],
  weekdays: [1, 2, 3, 4, 5],
  weekly: [1],
};

export function resolvePostingDaysForPreset(
  preset: AutopilotPostingPreset,
): number[] {
  return [...POSTING_PRESET_DAYS[preset]];
}

export function derivePostingPresetLabel(
  postingDays: number[],
): AutopilotPostingPreset | 'custom' {
  const normalized = [...postingDays].sort((a, b) => a - b).join(',');

  for (const [preset, days] of Object.entries(POSTING_PRESET_DAYS)) {
    if ([...days].sort((a, b) => a - b).join(',') === normalized) {
      return preset as AutopilotPostingPreset;
    }
  }

  return 'custom';
}

export function getLocalHour(timezone: string, now = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  return Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
}

export function parsePostingHour(postingTime: string): number {
  const [hour] = postingTime.split(':').map(Number);
  return hour;
}

function postingSlotUtc(
  dateKey: string,
  postingTime: string,
  timezone: string,
): Date {
  return localDateTimeToUtc(dateKey, postingTime, timezone);
}

export interface AutopilotDueCheckInput {
  enabled: boolean;
  postingDays: number[];
  postingTime: string;
  lastRunDateKey: string | null;
}

export function isDueNow(
  config: AutopilotDueCheckInput,
  timezone: string,
  now = new Date(),
): boolean {
  if (!config.enabled) {
    return false;
  }

  const todayKey = getTodayDateKey(timezone, now);
  if (config.lastRunDateKey === todayKey) {
    return false;
  }

  const weekday = getIsoWeekdayFromDateKey(todayKey, timezone);
  if (!config.postingDays.includes(weekday)) {
    return false;
  }

  const scheduledAt = postingSlotUtc(todayKey, config.postingTime, timezone);
  return now.getTime() >= scheduledAt.getTime();
}

export function computeNextRunAt(
  postingDays: number[],
  postingTime: string,
  timezone: string,
  now = new Date(),
): Date | null {
  if (postingDays.length === 0) {
    return null;
  }

  const todayKey = getTodayDateKey(timezone, now);

  for (let offset = 0; offset < 14; offset++) {
    const dateKey = addDaysToDateKey(todayKey, offset, timezone);
    const weekday = getIsoWeekdayFromDateKey(dateKey, timezone);

    if (!postingDays.includes(weekday)) {
      continue;
    }

    const slot = postingSlotUtc(dateKey, postingTime, timezone);
    if (slot.getTime() > now.getTime()) {
      return slot;
    }
  }

  return null;
}

export type NextGenerationState = 'due_now' | 'scheduled' | 'paused';

export interface NextGenerationResult {
  at: Date | null;
  state: NextGenerationState;
}

export function computeNextGenerationAt(
  config: AutopilotDueCheckInput,
  timezone: string,
  now = new Date(),
): NextGenerationResult {
  if (!config.enabled || config.postingDays.length === 0) {
    return { at: null, state: 'paused' };
  }

  if (isDueNow(config, timezone, now)) {
    const todayKey = getTodayDateKey(timezone, now);
    return {
      at: postingSlotUtc(todayKey, config.postingTime, timezone),
      state: 'due_now',
    };
  }

  const next = computeNextRunAt(
    config.postingDays,
    config.postingTime,
    timezone,
    now,
  );

  return { at: next, state: next ? 'scheduled' : 'paused' };
}

export function computeNextPlannedSlot(
  postingDays: number[],
  postingTime: string,
  timezone: string,
  now = new Date(),
): Date | null {
  return computeNextRunAt(postingDays, postingTime, timezone, now);
}

export function resolveTopicFromPillar(pillarName: string): string {
  return `Insights on ${pillarName}`;
}

export function nextPillarIndex(
  currentIndex: number,
  pillarCount: number,
): number {
  if (pillarCount <= 0) {
    return 0;
  }
  return (currentIndex + 1) % pillarCount;
}
