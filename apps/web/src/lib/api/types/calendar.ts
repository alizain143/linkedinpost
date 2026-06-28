import type { PostPackageStatus, PostType } from "@/lib/api/types/enums";

export type CalendarView = "month" | "week" | "list";

export type ApiCalendarEvent = {
  id: string;
  hook: string;
  pillar: string | null;
  status: PostPackageStatus;
  postType: PostType | null;
  scheduledAt: string;
};

export type ApiCalendarMonthCell = {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  posts: ApiCalendarEvent[];
};

export type ApiCalendarMonthResponse = {
  view: "month";
  year: number;
  month: number;
  timezone: string;
  cells: ApiCalendarMonthCell[];
};

export type ApiCalendarWeekDay = {
  date: string;
  dayOfWeek: string;
  day: number;
  posts: ApiCalendarEvent[];
};

export type ApiCalendarWeekResponse = {
  view: "week";
  startDate: string;
  endDate: string;
  timezone: string;
  days: ApiCalendarWeekDay[];
};

export type ApiCalendarListResponse = {
  view: "list";
  timezone: string;
  rangeStart: string;
  rangeEnd: string;
  items: ApiCalendarEvent[];
};

export type ApiCalendarResponse =
  | ApiCalendarMonthResponse
  | ApiCalendarWeekResponse
  | ApiCalendarListResponse;

export type CalendarQueryParams = {
  view: CalendarView;
  date?: string;
  status?: PostPackageStatus[];
  limit?: number;
};
