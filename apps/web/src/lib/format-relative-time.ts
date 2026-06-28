const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - now;
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const { unit, ms } of UNITS) {
    const value = Math.round(diffMs / ms);
    if (Math.abs(value) >= 1 || unit === "minute") {
      return formatter.format(value, unit);
    }
  }

  return formatter.format(0, "second");
}

export function formatScheduledDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatResetDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}
