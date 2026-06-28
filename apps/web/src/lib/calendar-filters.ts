import type { PostPackageStatus } from "@/lib/api/types/enums";

export type CalendarFilter =
  | "All"
  | "Scheduled"
  | "Published"
  | "Failed"
  | "Needs Approval";

export const CALENDAR_FILTERS: CalendarFilter[] = [
  "All",
  "Needs Approval",
  "Scheduled",
  "Published",
  "Failed",
];

const CALENDAR_FILTER_SET = new Set<string>(CALENDAR_FILTERS);

export function parseCalendarFilter(value: string | null): CalendarFilter {
  if (value && CALENDAR_FILTER_SET.has(value)) {
    return value as CalendarFilter;
  }
  return "All";
}

export function calendarFilterToStatuses(
  filter: CalendarFilter,
): PostPackageStatus[] | undefined {
  switch (filter) {
    case "All":
      return undefined;
    case "Scheduled":
      return ["scheduled", "publishing"];
    case "Published":
      return ["published"];
    case "Failed":
      return ["failed"];
    case "Needs Approval":
      return ["ready_for_approval"];
  }
}
