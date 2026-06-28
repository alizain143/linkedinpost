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
  formatListItemDate,
  getEventStatusStyle,
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

function CalendarMonthSkeleton() {
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

export default function Calendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeWorkspaceId } = useWorkspace();
  const { data: currentUser } = useCurrentUser();

  const userTimezone = currentUser?.timezone ?? DEFAULT_TIMEZONE;
  const initialView = parseCalendarView(searchParams.get("view"));
  const initialFilter = parseCalendarFilter(searchParams.get("filter"));
  const initialDate = isIsoDateKey(searchParams.get("date"))
    ? searchParams.get("date")!
    : getTodayDateKey(userTimezone);

  const highlightDates = useMemo(() => {
    const raw = searchParams.get("highlight");
    if (!raw) return new Set<string>();
    return new Set(
      raw.split(",").filter((value): value is string => isIsoDateKey(value)),
    );
  }, [searchParams]);

  const [view, setView] = useState<CalendarView>(initialView);
  const [filter, setFilter] = useState<CalendarFilter>(initialFilter);
  const [anchorDate, setAnchorDate] = useState(initialDate);
  const timezoneSyncedRef = useRef(false);

  useEffect(() => {
    if (currentUser?.timezone && !timezoneSyncedRef.current) {
      if (!isIsoDateKey(searchParams.get("date"))) {
        setAnchorDate(getTodayDateKey(currentUser.timezone));
      }
      timezoneSyncedRef.current = true;
    }
  }, [currentUser?.timezone, searchParams]);

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
      ...(statusParam ? { status: statusParam } : {}),
      ...(view === "list" ? { limit: 50 } : {}),
    }),
    [anchorDate, statusParam, view],
  );

  const { data, isLoading, error, refetch } = useCalendar(
    activeWorkspaceId,
    queryParams,
  );

  const displayTimezone = data?.timezone ?? userTimezone;
  const headerLabel = formatCalendarHeaderLabel(data, anchorDate);

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
          <div className="flex gap-1">
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label={view === "month" ? "Previous month" : "Previous period"}
              onClick={goPrev}
            >
              <MsIcon name="chevron_left" size={18} className="text-[#475569]" />
            </Button>
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label={view === "month" ? "Next month" : "Next period"}
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

      <QueryState
        isLoading={isLoading}
        error={error}
        skeleton={calendarSkeleton}
        onRetry={() => void refetch()}
      >
        {data?.view === "month" ? (
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
                      {posts.map((post) => (
                        <CalendarEventChip key={post.id} event={post} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {data?.view === "week" ? (
          <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
            <div className="grid grid-cols-7">
              {data.days.map((day) => {
                const inAnchorMonth = isInAnchorMonth(day.date, anchorDate);
                const isHighlighted = highlightDates.has(day.date);
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
                        className={`mt-1 font-display text-lg font-bold ${
                          day.date === getTodayDateKey(data.timezone)
                            ? "text-[#4f46e5]"
                            : inAnchorMonth
                              ? "text-[#1e293b]"
                              : "text-[#cbd2e0]"
                        }`}
                      >
                        {day.day}
                      </div>
                    </div>
                    <div className="flex min-h-[200px] flex-col gap-1.5">
                      {day.posts.map((post) => {
                        const style = getEventStatusStyle(post.status);
                        return (
                          <Link
                            key={post.id}
                            href={`/app/posts/${post.id}`}
                            className="cursor-pointer rounded-[9px] p-2 hover:brightness-[0.97]"
                            style={{
                              background: style.bg,
                              border: `1px solid ${style.c}22`,
                            }}
                          >
                            <div
                              className="mb-0.5 text-[10px] font-bold"
                              style={{ color: style.c }}
                            >
                              {formatCalendarEventTime(
                                post.scheduledAt,
                                data.timezone,
                              )}
                            </div>
                            <div className="text-[11.5px] font-semibold leading-snug text-[#1e293b]">
                              {post.hook}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {data?.view === "list" ? (
          data.items.length > 0 ? (
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
          ) : (
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
              <p className="mt-1 text-xs text-[#94a3b8]">
                {data.rangeStart} – {data.rangeEnd}
              </p>
            </div>
          )
        ) : null}
      </QueryState>
    </div>
  );
}
