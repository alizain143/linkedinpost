import type { PostPackageStatus } from "@/lib/api/types/enums";

export type CalendarFilter =
  | "All"
  | "Scheduled"
  | "Published"
  | "Failed"
  | "Ready for Approval";

export const CALENDAR_ALL_STATUSES: PostPackageStatus[] = [
  "ready_for_approval",
  "scheduled",
  "publishing",
  "published",
  "failed",
];

export const CALENDAR_FILTERS: CalendarFilter[] = [
  "All",
  "Ready for Approval",
  "Scheduled",
  "Published",
  "Failed",
];

const CALENDAR_FILTER_SET = new Set<string>([
  ...CALENDAR_FILTERS,
  "Needs Approval",
]);

const LEGACY_FILTER_ALIASES: Record<string, CalendarFilter> = {
  "Needs Approval": "Ready for Approval",
};

export function parseCalendarFilter(value: string | null): CalendarFilter {
  if (value && CALENDAR_FILTER_SET.has(value)) {
    return (LEGACY_FILTER_ALIASES[value] ?? value) as CalendarFilter;
  }
  return "All";
}

export function calendarFilterToStatuses(
  filter: CalendarFilter,
): PostPackageStatus[] {
  switch (filter) {
    case "All":
      return CALENDAR_ALL_STATUSES;
    case "Scheduled":
      return ["scheduled", "publishing"];
    case "Published":
      return ["published"];
    case "Failed":
      return ["failed"];
    case "Ready for Approval":
      return ["ready_for_approval"];
  }
}
