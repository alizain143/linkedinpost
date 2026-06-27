import { CalendarEvent } from './calendar.mapper';
import { CalendarView } from './dto/calendar-query.dto';

export interface CalendarMonthCell {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  posts: CalendarEvent[];
}

export interface CalendarWeekDay {
  date: string;
  dayOfWeek: string;
  day: number;
  posts: CalendarEvent[];
}

export interface CalendarMonthResponse {
  view: CalendarView.month;
  year: number;
  month: number;
  timezone: string;
  cells: CalendarMonthCell[];
}

export interface CalendarWeekResponse {
  view: CalendarView.week;
  startDate: string;
  endDate: string;
  timezone: string;
  days: CalendarWeekDay[];
}

export interface CalendarListResponse {
  view: CalendarView.list;
  timezone: string;
  rangeStart: Date;
  rangeEnd: Date;
  items: CalendarEvent[];
}

export type CalendarResponse =
  | CalendarMonthResponse
  | CalendarWeekResponse
  | CalendarListResponse;
