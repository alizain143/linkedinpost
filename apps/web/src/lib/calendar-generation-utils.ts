import type { UserPlan } from "@/lib/api/types/enums";
import type { CalendarJobResult } from "@/lib/api/types/generation";
import {
  getTodayDateKey,
  shiftAnchorDate,
} from "@/lib/calendar-utils";
import {
  COUNCIL_CREDIT_COST,
  type CalendarSlotGenerationMode,
  QUICK_DRAFT_CREDIT_COST,
} from "@/lib/credit-costs";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";

export const DEFAULT_POSTING_TIME = "09:00";
export const DEFAULT_POSTING_DAYS = [1, 2, 3, 4, 5] as const;

export const POSTING_DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

export function getCalendarCreditCost(
  durationDays: 7 | 30,
  mode: CalendarSlotGenerationMode = "quick_draft",
): number {
  const perSlot =
    mode === "council" ? COUNCIL_CREDIT_COST : QUICK_DRAFT_CREDIT_COST;
  return durationDays * perSlot;
}

export function getCalendarPerSlotCreditCost(
  mode: CalendarSlotGenerationMode,
): number {
  return mode === "council" ? COUNCIL_CREDIT_COST : QUICK_DRAFT_CREDIT_COST;
}

export function canUse30DayCalendar(plan: UserPlan): boolean {
  return plan === "pro" || plan === "agency";
}

export function tomorrowDateKey(timezone = DEFAULT_TIMEZONE): string {
  const today = getTodayDateKey(timezone);
  return shiftAnchorDate(today, { days: 1 });
}

export function isCalendarJobResult(
  result: CalendarJobResult | unknown | null | undefined,
): result is CalendarJobResult {
  return (
    !!result &&
    typeof result === "object" &&
    "slotCount" in result &&
    "slots" in result
  );
}

export function normalizePostingTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return DEFAULT_POSTING_TIME;
  return `${match[1]}:${match[2]}`;
}

export function formatCalendarCreditBreakdown(
  durationDays: 7 | 30,
  mode: CalendarSlotGenerationMode,
): string {
  const perSlot = getCalendarPerSlotCreditCost(mode);
  const total = getCalendarCreditCost(durationDays, mode);
  const modeNote =
    mode === "council"
      ? " (includes reviewed post + image per slot)"
      : " (text only per slot)";
  return `${durationDays} posts × ${perSlot} credit${perSlot === 1 ? "" : "s"} = ${total} credits${modeNote}`;
}
