import { getTodayDateKey, shiftAnchorDate } from "@/lib/calendar-utils";

export const SCHEDULE_MIN_LEAD_MINUTES = 15;
export const SCHEDULE_MAX_DAYS = 90;
export const DEFAULT_SCHEDULE_TIME = "09:00";

function readLocalParts(isoOrMs: string | number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoOrMs));

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? 0),
    month: Number(parts.find((part) => part.type === "month")?.value ?? 0),
    day: Number(parts.find((part) => part.type === "day")?.value ?? 0),
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? 0),
  };
}

export function getDefaultScheduleDateKey(timezone: string): string {
  return shiftAnchorDate(getTodayDateKey(timezone), { days: 1 });
}

export function parseScheduleFormValue(
  dateKey: string,
  time: string,
  timezone: string,
): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const local = readLocalParts(guess, timezone);
    const localAsUtc = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
    );
    const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    guess += targetAsUtc - localAsUtc;
  }

  return new Date(guess).toISOString();
}

export function formatScheduleFormValue(
  iso: string,
  timezone: string,
): { dateKey: string; time: string } {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

  const parts = readLocalParts(iso, timezone);
  const hour = String(parts.hour).padStart(2, "0");
  const minute = String(parts.minute).padStart(2, "0");

  return { dateKey, time: `${hour}:${minute}` };
}

export function validateScheduleAt(
  iso: string,
  now = new Date(),
): string | null {
  const scheduledMs = new Date(iso).getTime();
  const nowMs = now.getTime();
  const minLeadMs = SCHEDULE_MIN_LEAD_MINUTES * 60 * 1000;
  const maxMs = SCHEDULE_MAX_DAYS * 24 * 60 * 60 * 1000;

  if (Number.isNaN(scheduledMs)) {
    return "Pick a valid date and time.";
  }

  if (scheduledMs <= nowMs) {
    return "Scheduled time must be in the future.";
  }

  if (scheduledMs < nowMs + minLeadMs) {
    return `Schedule at least ${SCHEDULE_MIN_LEAD_MINUTES} minutes from now.`;
  }

  if (scheduledMs > nowMs + maxMs) {
    return `Schedule within the next ${SCHEDULE_MAX_DAYS} days.`;
  }

  return null;
}

export function getScheduleDateInputMin(timezone: string): string {
  return getTodayDateKey(timezone);
}

export function getScheduleDateInputMax(timezone: string): string {
  return shiftAnchorDate(getTodayDateKey(timezone), { days: SCHEDULE_MAX_DAYS });
}
