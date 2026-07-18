"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBadge } from "@/components/app/app-ui";
import { QueryState } from "@/components/app/query-state";
import { CalendarEventChip } from "@/components/sections/app/calendar/CalendarEventChip";
import { Button, filterVariant, segmentVariant } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import { useCurrentUser } from "@/hooks/api/use-auth-api";
import { useCalendar } from "@/hooks/api/use-calendar-api";
import { useWorkspace } from "@/hooks/use-workspace";
import type { CalendarView } from "@/lib/api/types/calendar";
import {
  CALENDAR_FILTERS,
  calendarFilterToStatuses,
  parseCalendarFilter,
  type CalendarFilter,
} from "@/lib/calendar-filters";
import {
  formatCalendarEventTime,
  formatCalendarHeaderLabel,
  formatCalendarRange,
  formatListItemDate,
  getLegendLabel,
  getTodayDateKey,
  shiftAnchorDate,
} from "@/lib/calendar-utils";
import {
  CALENDAR_LEGEND_STATUSES,
  POST_STATUS_STYLES,
} from "@/lib/post-status";
import { DEFAULT_TIMEZONE, timezoneLabel } from "@/lib/timezones";

const VIEW_OPTIONS: CalendarView[] = ["month", "week", "list"];
const MONTH_VISIBLE_POSTS = 3;
const LIST_LIMIT = 50;

function calendarNavPrevLabel(calendarView: CalendarView): string {
  switch (calendarView) {
    case "month":
      return "Previous month";
    case "week":
      return "Previous week";
    case "list":
      return "Previous 7 days";
  }
}

function calendarNavNextLabel(calendarView: CalendarView): string {
  switch (calendarView) {
    case "month":
      return "Next month";
    case "week":
      return "Next week";
    case "list":
      return "Next 7 days";
  }
}

function parseCalendarView(value: string | null): CalendarView {
  if (value === "week" || value === "list" || value === "month") {
    return value;
  }
  return "month";
}

function isIsoDateKey(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isInAnchorMonth(dayDate: string, anchorDate: string): boolean {
  return dayDate.slice(0, 7) === anchorDate.slice(0, 7);
}

export function CalendarMonthSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
      <div className="grid grid-cols-7 border-b border-[#f1f3f8]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse bg-[#f8f9fc]" />
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[104px] animate-pulse border-b border-r border-[#f1f3f8] bg-[#fbfbfc] last:border-r-0"
          />
        ))}
      </div>
    </div>
  );
}

function CalendarListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[74px] animate-pulse border-b border-[#f1f3f8] last:border-0"
        />
      ))}
    </div>
  );
}

function CalendarEmptyState({
  filter,
  timezone,
  rangeStart,
  rangeEnd,
}: {
  filter: CalendarFilter;
  timezone: string;
  rangeStart?: string | Date;
  rangeEnd?: string | Date;
}) {
  return (
    <div className="rounded-2xl border border-[#eceef4] bg-white px-6 py-14 text-center">
      <MsIcon
        name="event_busy"
        size={36}
        className="mx-auto mb-3 text-[#cbd2e0]"
      />
      <p className="text-sm font-semibold text-[#64748b]">
        No posts in this range
        {filter !== "All" ? ` matching “${filter}”` : ""}.
      </p>
      {rangeStart && rangeEnd ? (
        <p className="mt-1 text-xs text-[#94a3b8]">
          {formatCalendarRange(rangeStart, rangeEnd, timezone)}
        </p>
      ) : null}
    </div>
  );
}

export default function Calendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeWorkspaceId } = useWorkspace();
  const { data: currentUser } = useCurrentUser();

  const userTimezone = currentUser?.timezone ?? DEFAULT_TIMEZONE;
  const urlView = parseCalendarView(searchParams.get("view"));
  const urlFilter = parseCalendarFilter(searchParams.get("filter"));
  const urlDate = isIsoDateKey(searchParams.get("date"))
    ? searchParams.get("date")!
    : getTodayDateKey(userTimezone);

  const highlightDates = useMemo(() => {
    const raw = searchParams.get("highlight");
    if (!raw) return new Set<string>();
    return new Set(
      raw.split(",").filter((value): value is string => isIsoDateKey(value)),
    );
  }, [searchParams]);

  const [view, setView] = useState<CalendarView>(urlView);
  const [filter, setFilter] = useState<CalendarFilter>(urlFilter);
  const [anchorDate, setAnchorDate] = useState(urlDate);
  const timezoneSyncedRef = useRef(false);

  useEffect(() => {
    setView(urlView);
    setFilter(urlFilter);
    setAnchorDate(urlDate);
  }, [urlView, urlFilter, urlDate]);

  useEffect(() => {
    if (currentUser?.timezone && !timezoneSyncedRef.current) {
      if (!isIsoDateKey(searchParams.get("date"))) {
        const correctedDate = getTodayDateKey(currentUser.timezone);
        setAnchorDate(correctedDate);
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", correctedDate);
        router.replace(`/app/calendar?${params.toString()}`, { scroll: false });
      }
      timezoneSyncedRef.current = true;
    }
  }, [currentUser?.timezone, router, searchParams]);

  const syncUrl = useCallback(
    (next: {
      view?: CalendarView;
      date?: string;
      filter?: CalendarFilter;
      highlight?: string | null;
    }) => {
      const params = new URLSearchParams();
      params.set("view", next.view ?? view);
      params.set("date", next.date ?? anchorDate);
      params.set("filter", next.filter ?? filter);
      const highlight =
        next.highlight !== undefined
          ? next.highlight
          : searchParams.get("highlight");
      if (highlight) params.set("highlight", highlight);
      router.replace(`/app/calendar?${params.toString()}`, { scroll: false });
    },
    [anchorDate, filter, router, searchParams, view],
  );

  const statusParam = useMemo(
    () => calendarFilterToStatuses(filter),
    [filter],
  );

  const queryParams = useMemo(
    () => ({
      view,
      date: anchorDate,
      status: statusParam,
      ...(view === "list" ? { limit: LIST_LIMIT } : {}),
    }),
    [anchorDate, statusParam, view],
  );

  const { data, isLoading, error, refetch } = useCalendar(
    activeWorkspaceId,
    queryParams,
  );

  const displayTimezone = data?.timezone ?? userTimezone;
  const headerLabel = formatCalendarHeaderLabel(data, anchorDate, view);
  const showHighlightBanner = highlightDates.size > 0;

  const hasNoPosts = useMemo(() => {
    if (!data) return false;
    if (data.view === "month") {
      return data.cells.every((cell) => cell.posts.length === 0);
    }
    if (data.view === "week") {
      return data.days.every((day) => day.posts.length === 0);
    }
    return false;
  }, [data]);

  const goPrev = () => {
    const nextDate =
      view === "month"
        ? shiftAnchorDate(anchorDate, { months: -1 })
        : shiftAnchorDate(anchorDate, { days: -7 });
    setAnchorDate(nextDate);
    syncUrl({ date: nextDate });
  };

  const goNext = () => {
    const nextDate =
      view === "month"
        ? shiftAnchorDate(anchorDate, { months: 1 })
        : shiftAnchorDate(anchorDate, { days: 7 });
    setAnchorDate(nextDate);
    syncUrl({ date: nextDate });
  };

  const goToday = () => {
    const nextDate = getTodayDateKey(displayTimezone);
    setAnchorDate(nextDate);
    syncUrl({ date: nextDate });
  };

  const handleViewChange = (nextView: CalendarView) => {
    setView(nextView);
    syncUrl({ view: nextView });
  };

  const handleFilterChange = (nextFilter: CalendarFilter) => {
    setFilter(nextFilter);
    syncUrl({ filter: nextFilter });
  };

  const dismissHighlight = () => {
    syncUrl({ highlight: null });
  };

  const calendarSkeleton =
    view === "list" ? <CalendarListSkeleton /> : <CalendarMonthSkeleton />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div>
            <h2 className="font-display text-xl font-bold">{headerLabel}</h2>
            <p className="text-[11.5px] text-[#94a3b8]">
              Times shown in {timezoneLabel(displayTimezone)}
            </p>
          </div>
          <div className="flex gap-1" data-tour="calendar-nav">
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label={calendarNavPrevLabel(view)}
              onClick={goPrev}
            >
              <MsIcon name="chevron_left" size={18} className="text-[#475569]" />
            </Button>
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label={calendarNavNextLabel(view)}
              onClick={goNext}
            >
              <MsIcon name="chevron_right" size={18} className="text-[#475569]" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-[8px] px-2.5 text-xs font-semibold text-[#64748b]"
              onClick={goToday}
            >
              Today
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5 rounded-[10px] bg-[#eef0f5] p-0.5">
            {VIEW_OPTIONS.map((v) => (
              <Button
                key={v}
                type="button"
                variant={segmentVariant(view === v)}
                size="sm"
                className="rounded-[8px] px-3.5 py-1.5 capitalize"
                onClick={() => handleViewChange(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <Button
            href="/app/generate/calendar"
            variant="secondary"
            size="sm"
            className="rounded-[10px]"
          >
            <MsIcon name="calendar_month" size={17} />
            Generate calendar
          </Button>
          <Button
            href="/app/generate"
            variant="primary"
            size="sm"
            className="rounded-[10px] shadow-[0_3px_10px_rgba(79,70,229,0.26)]"
          >
            <MsIcon name="add" size={17} />
            Add Post
          </Button>
        </div>
      </div>

      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {CALENDAR_FILTERS.map((f) => (
          <Button
            key={f}
            type="button"
            variant={filterVariant(filter === f)}
            shape="pill"
            size="sm"
            onClick={() => handleFilterChange(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        {CALENDAR_LEGEND_STATUSES.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b]"
          >
            <span
              className="h-2 w-2 rounded-[3px]"
              style={{ background: POST_STATUS_STYLES[status].text }}
            />
            {getLegendLabel(status)}
          </span>
        ))}
      </div>

      {showHighlightBanner ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[11px] border border-[#c7d2fe] bg-[#eef2ff] px-3.5 py-2.5 text-[13px] text-[#4338ca]">
          <span className="inline-flex items-center gap-2">
            <MsIcon name="info" size={18} />
            Newly generated posts are highlighted on the calendar.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-[#4338ca]"
            onClick={dismissHighlight}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      <QueryState
        isLoading={isLoading}
        error={error}
        skeleton={calendarSkeleton}
        onRetry={() => void refetch()}
      >
        {data?.view === "month" ? (
          hasNoPosts ? (
            <CalendarEmptyState filter={filter} timezone={displayTimezone} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
              <div className="grid grid-cols-7 border-b border-[#f1f3f8]">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                  <div
                    key={d}
                    className="py-2.5 text-center text-[11.5px] font-bold tracking-wide text-[#94a3b8]"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {data.cells.map((cell) => {
                  const posts = cell.posts;
                  const visiblePosts = posts.slice(0, MONTH_VISIBLE_POSTS);
                  const overflowCount = posts.length - visiblePosts.length;
                  const isHighlighted = highlightDates.has(cell.date);
                  return (
                    <div
                      key={cell.date}
                      className={`min-h-[104px] border-b border-r border-[#f1f3f8] p-2 last:border-r-0 ${
                        isHighlighted
                          ? "bg-[#eef2ff] ring-2 ring-inset ring-[#4f46e5]"
                          : cell.isToday
                            ? "bg-[#fafbff]"
                            : cell.inMonth
                              ? ""
                              : "bg-[#fbfbfc]"
                      }`}
                    >
                      <div
                        className={`mb-1 flex h-7 w-7 items-center justify-center text-sm font-semibold ${
                          cell.isToday
                            ? "rounded-full bg-[#4f46e5] text-white"
                            : cell.inMonth
                              ? "text-[#64748b]"
                              : "text-[#cbd2e0]"
                        }`}
                      >
                        {cell.day}
                      </div>
                      <div className="flex flex-col gap-1">
                        {visiblePosts.map((post) => (
                          <CalendarEventChip
                            key={post.id}
                            event={post}
                            timezone={displayTimezone}
                          />
                        ))}
                        {overflowCount > 0 ? (
                          <button
                            type="button"
                            className="px-1 text-left text-[10px] font-semibold text-[#64748b] hover:text-[#4f46e5]"
                            onClick={() => {
                              setAnchorDate(cell.date);
                              setView("week");
                              syncUrl({ view: "week", date: cell.date });
                            }}
                          >
                            +{overflowCount} more
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : null}

        {data?.view === "week" ? (
          hasNoPosts ? (
            <CalendarEmptyState filter={filter} timezone={displayTimezone} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
              <div className="grid grid-cols-7">
                {data.days.map((day) => {
                  const inAnchorMonth = isInAnchorMonth(day.date, anchorDate);
                  const isHighlighted = highlightDates.has(day.date);
                  const isToday = day.date === getTodayDateKey(data.timezone);
                  return (
                    <div
                      key={day.date}
                      className={`border-r border-[#f1f3f8] p-3 last:border-r-0 ${
                        isHighlighted
                          ? "bg-[#eef2ff] ring-2 ring-inset ring-[#4f46e5]"
                          : !inAnchorMonth
                            ? "bg-[#fbfbfc]"
                            : ""
                      }`}
                    >
                      <div className="mb-3 border-b border-[#f1f3f8] pb-3 text-center">
                        <div className="text-[11px] font-bold tracking-wide text-[#94a3b8]">
                          {day.dayOfWeek}
                        </div>
                        <div
                          className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center font-display text-lg font-bold ${
                            isToday
                              ? "rounded-full bg-[#4f46e5] text-white"
                              : inAnchorMonth
                                ? "text-[#1e293b]"
                                : "text-[#cbd2e0]"
                          }`}
                        >
                          {day.day}
                        </div>
                      </div>
                      <div className="flex min-h-[200px] flex-col gap-1.5">
                        {day.posts.map((post) => (
                          <CalendarEventChip
                            key={post.id}
                            event={post}
                            timezone={data.timezone}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : null}

        {data?.view === "list" ? (
          data.items.length > 0 ? (
            <div>
              <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
                {data.items.map((item) => {
                  const dateParts = formatListItemDate(
                    item.scheduledAt,
                    data.timezone,
                  );
                  return (
                    <Link
                      key={item.id}
                      href={`/app/posts/${item.id}`}
                      className="flex items-center gap-4 border-b border-[#f1f3f8] px-5 py-4 last:border-0 hover:bg-[#fafbff]"
                    >
                      <div className="flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center rounded-[11px] bg-[#eef2ff]">
                        <span className="text-[10px] font-bold text-[#4f46e5]">
                          {dateParts.monthAbbr}
                        </span>
                        <span className="font-display text-lg font-extrabold text-[#4338ca]">
                          {dateParts.day}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#1e293b]">
                          {item.hook}
                        </div>
                        <div className="text-xs text-[#94a3b8]">
                          {formatCalendarEventTime(
                            item.scheduledAt,
                            data.timezone,
                          )}
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </Link>
                  );
                })}
              </div>
              {data.items.length >= LIST_LIMIT ? (
                <p className="mt-2 text-center text-xs text-[#94a3b8]">
                  Showing first {LIST_LIMIT} posts
                </p>
              ) : null}
            </div>
          ) : (
            <CalendarEmptyState
              filter={filter}
              timezone={displayTimezone}
              rangeStart={data.rangeStart}
              rangeEnd={data.rangeEnd}
            />
          )
        ) : null}
      </QueryState>
    </div>
  );
}
