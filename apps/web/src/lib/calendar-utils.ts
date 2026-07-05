import type {
  ApiCalendarEvent,
  ApiCalendarResponse,
  CalendarView,
} from "@/lib/api/types/calendar";
import type { PostPackageStatus } from "@/lib/api/types/enums";
import {
  getPostStatusLabel,
  POST_STATUS_STYLES,
} from "@/lib/post-status";

export function getTodayDateKey(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftAnchorDate(
  dateKey: string,
  delta: { months?: number; days?: number },
): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));

  if (delta.months) {
    date.setUTCMonth(date.getUTCMonth() + delta.months);
  }
  if (delta.days) {
    date.setUTCDate(date.getUTCDate() + delta.days);
  }

  return date.toISOString().slice(0, 10);
}

export function formatCalendarEventTime(
  iso: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatCalendarHeaderLabel(
  data: ApiCalendarResponse | undefined,
  anchorDate: string,
  view: CalendarView = "month",
): string {
  if (!data) {
    if (view === "list") {
      return "Posts";
    }
    const [year, month] = anchorDate.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  if (data.view === "month") {
    return new Date(Date.UTC(data.year, data.month - 1, 1)).toLocaleDateString(
      "en-US",
      { month: "long", year: "numeric" },
    );
  }

  if (data.view === "week") {
    const start = new Date(`${data.startDate}T12:00:00.000Z`);
    const end = new Date(`${data.endDate}T12:00:00.000Z`);
    const startLabel = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endLabel = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: start.getUTCFullYear() === end.getUTCFullYear() ? undefined : "numeric",
    });
    return `${startLabel} – ${endLabel}`;
  }

  return formatCalendarRange(data.rangeStart, data.rangeEnd, data.timezone);
}

export function getEventStatusStyle(status: PostPackageStatus): {
  c: string;
  bg: string;
} {
  const style = POST_STATUS_STYLES[status];
  return { c: style.text, bg: style.bg };
}

export function formatListItemDate(
  iso: string,
  timezone: string,
): { monthAbbr: string; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date(iso));
  const monthAbbr =
    parts.find((part) => part.type === "month")?.value ?? "";
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);
  return { monthAbbr, day };
}

export function getLegendLabel(status: PostPackageStatus): string {
  return getPostStatusLabel(status);
}

export function instantToDateKey(iso: string, timezone: string): string {
  return getTodayDateKey(timezone, new Date(iso));
}

export function formatCalendarRange(
  start: string | Date,
  end: string | Date,
  timezone: string,
): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

export type { ApiCalendarEvent };
