"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/app/app-ui";
import { Button, filterVariant, segmentVariant } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";

const FILTERS = [
  "All",
  "Needs Approval",
  "Scheduled",
  "Published",
  "Failed",
  "Autopilot",
  "Manual",
] as const;

const LEGEND = [
  { label: "Idea", color: "#64748b" },
  { label: "Draft", color: "#7c3aed" },
  { label: "Scheduled", color: "#4f46e5" },
  { label: "Published", color: "#16a34a" },
];

type CalPost = {
  title: string;
  status: string;
  source?: "Autopilot" | "Manual";
  time?: string;
};

const MONTH_POSTS: Record<string, Record<number, CalPost[]>> = {
  "2026-5": {
    8: [{ title: "May momentum check-in", status: "Published", source: "Manual", time: "9:00 AM" }],
    15: [{ title: "What we shipped in May", status: "Published", source: "Autopilot", time: "8:30 AM" }],
    22: [{ title: "Hiring update", status: "Scheduled", source: "Manual", time: "9:00 AM" }],
    29: [{ title: "Q2 lessons learned", status: "Draft", source: "Autopilot", time: "10:00 AM" }],
  },
  "2026-6": {
    2: [{ title: "I almost shut down…", status: "Published", source: "Autopilot", time: "9:00 AM" }],
    4: [{ title: "3 hiring mistakes…", status: "Scheduled", source: "Manual", time: "8:30 AM" }],
    6: [{ title: "Why most LinkedIn…", status: "Scheduled", source: "Autopilot", time: "9:00 AM" }],
    9: [{ title: "B2B hooks framework", status: "Draft", source: "Manual", time: "9:00 AM" }],
    11: [{ title: "$1M ARR with zero ads", status: "Published", source: "Manual", time: "10:00 AM" }],
    16: [{ title: "Cold outreach is dead", status: "Failed", source: "Autopilot", time: "9:00 AM" }],
    23: [{ title: "The hire that changed…", status: "Idea", source: "Autopilot", time: "9:00 AM" }],
    27: [{ title: "Enterprise deal lessons", status: "Scheduled", source: "Manual", time: "9:00 AM" }],
  },
  "2026-7": {
    3: [{ title: "Mid-year founder reset", status: "Draft", source: "Manual", time: "9:00 AM" }],
    8: [{ title: "Summer hiring playbook", status: "Scheduled", source: "Autopilot", time: "8:30 AM" }],
    14: [{ title: "Contrarian take on PLG", status: "Needs Approval", source: "Manual", time: "9:00 AM" }],
    21: [{ title: "What churn taught us", status: "Idea", source: "Autopilot", time: "9:00 AM" }],
    28: [{ title: "July product recap", status: "Scheduled", source: "Manual", time: "10:00 AM" }],
  },
};

const STATUS_COLORS: Record<string, { c: string; bg: string }> = {
  Published: { c: "#16a34a", bg: "#f0fdf4" },
  Scheduled: { c: "#4f46e5", bg: "#eef2ff" },
  Draft: { c: "#7c3aed", bg: "#f5f0ff" },
  Failed: { c: "#dc2626", bg: "#fef2f2" },
  Idea: { c: "#64748b", bg: "#f1f3f8" },
  "Needs Approval": { c: "#d97706", bg: "#fff8eb" },
};

const TODAY = { year: 2026, month: 5, day: 27 };
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(year: number, month: number) {
  return `${year}-${month + 1}`;
}

function filterPosts(posts: CalPost[], filter: string) {
  if (filter === "All") return posts;
  if (filter === "Autopilot") return posts.filter((p) => p.source === "Autopilot");
  if (filter === "Manual") return posts.filter((p) => p.source === "Manual");
  return posts.filter((p) => p.status === filter);
}

function buildMonthCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const jsDay = firstDay.getDay();
  const leadBlanks = jsDay === 0 ? 6 : jsDay - 1;

  const cells: { day: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < leadBlanks; i++) cells.push({ day: null, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isToday:
        year === TODAY.year && month === TODAY.month && d === TODAY.day,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, isToday: false });
  return cells;
}

function getWeekDays(year: number, month: number, anchorDay: number) {
  const anchor = new Date(year, month, anchorDay);
  const jsDay = anchor.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(year, month, anchorDay + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      inMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday:
        d.getFullYear() === TODAY.year &&
        d.getMonth() === TODAY.month &&
        d.getDate() === TODAY.day,
      dow: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i],
    };
  });
}

function PostChip({ post }: { post: CalPost }) {
  const sc = STATUS_COLORS[post.status] ?? STATUS_COLORS.Idea;
  return (
    <div
      className="cursor-pointer rounded-md px-1.5 py-1 hover:brightness-[0.97]"
      style={{ background: sc.bg, borderLeft: `3px solid ${sc.c}` }}
    >
      <div
        className="truncate text-[11px] font-semibold leading-tight"
        style={{ color: sc.c }}
      >
        {post.title}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [filter, setFilter] = useState<string>("All");
  const [monthDate, setMonthDate] = useState(() => new Date(2026, 5, 1));
  const [weekAnchorDay, setWeekAnchorDay] = useState(9);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const key = monthKey(year, month);
  const monthPosts = MONTH_POSTS[key] ?? {};

  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const weekDays = useMemo(
    () => getWeekDays(year, month, weekAnchorDay),
    [year, month, weekAnchorDay],
  );

  const listItems = useMemo(() => {
    return Object.entries(monthPosts)
      .flatMap(([day, posts]) =>
        filterPosts(posts, filter).map((post) => ({
          ...post,
          day: Number(day),
        })),
      )
      .sort((a, b) => a.day - b.day);
  }, [monthPosts, filter]);

  const goPrevMonth = () => {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setWeekAnchorDay(1);
  };

  const goNextMonth = () => {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setWeekAnchorDay(1);
  };

  const postsForDay = (day: number) =>
    filterPosts(monthPosts[day] ?? [], filter);

  const postsForDate = (y: number, m: number, day: number) => {
    const k = monthKey(y, m);
    return filterPosts(MONTH_POSTS[k]?.[day] ?? [], filter);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <h2 className="font-display text-xl font-bold">{monthLabel}</h2>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label="Previous month"
              onClick={goPrevMonth}
            >
              <MsIcon name="chevron_left" size={18} className="text-[#475569]" />
            </Button>
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label="Next month"
              onClick={goNextMonth}
            >
              <MsIcon name="chevron_right" size={18} className="text-[#475569]" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5 rounded-[10px] bg-[#eef0f5] p-0.5">
            {(["month", "week", "list"] as const).map((v) => (
              <Button
                key={v}
                type="button"
                variant={segmentVariant(view === v)}
                size="sm"
                className="rounded-[8px] px-3.5 py-1.5 capitalize"
                onClick={() => setView(v)}
              >
                {v}
              </Button>
            ))}
          </div>
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
        {FILTERS.map((f) => (
          <Button
            key={f}
            type="button"
            variant={filterVariant(filter === f, f === "Autopilot" && filter !== f)}
            shape="pill"
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "Autopilot" ? (
              <span className="inline-flex items-center gap-1">
                <MsIcon name="auto_mode" size={14} />
                Autopilot
              </span>
            ) : (
              f
            )}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        {LEGEND.map((l) => (
          <span
            key={l.label}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b]"
          >
            <span
              className="h-2 w-2 rounded-[3px]"
              style={{ background: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>

      {view === "month" ? (
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
            {cells.map((cell, i) => {
              const posts = cell.day ? postsForDay(cell.day) : [];
              return (
                <div
                  key={i}
                  className={`min-h-[104px] border-b border-r border-[#f1f3f8] p-2 last:border-r-0 ${
                    cell.isToday ? "bg-[#fafbff]" : cell.day ? "" : "bg-[#fbfbfc]"
                  }`}
                >
                  {cell.day ? (
                    <>
                      <div
                        className={`mb-1 flex h-7 w-7 items-center justify-center text-sm font-semibold ${
                          cell.isToday
                            ? "rounded-full bg-[#4f46e5] text-white"
                            : "text-[#64748b]"
                        }`}
                      >
                        {cell.day}
                      </div>
                      <div className="flex flex-col gap-1">
                        {posts.map((p) => (
                          <PostChip key={p.title} post={p} />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : view === "week" ? (
        <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
          <div className="grid grid-cols-7">
            {weekDays.map((w, i) => {
              const posts = w.inMonth
                ? postsForDay(w.day)
                : postsForDate(w.year, w.month, w.day);
              return (
                <div
                  key={`${w.dow}-${i}`}
                  className={`border-r border-[#f1f3f8] p-3 last:border-r-0 ${
                    !w.inMonth ? "bg-[#fbfbfc]" : ""
                  }`}
                >
                  <div className="mb-3 border-b border-[#f1f3f8] pb-3 text-center">
                    <div className="text-[11px] font-bold tracking-wide text-[#94a3b8]">
                      {w.dow}
                    </div>
                    <div
                      className={`mt-1 font-display text-lg font-bold ${
                        w.isToday ? "text-[#4f46e5]" : "text-[#1e293b]"
                      }`}
                    >
                      {w.day}
                    </div>
                  </div>
                  <div className="flex min-h-[200px] flex-col gap-1.5">
                    {posts.map((p) => {
                      const sc = STATUS_COLORS[p.status] ?? STATUS_COLORS.Idea;
                      return (
                        <div
                          key={p.title}
                          className="cursor-pointer rounded-[9px] p-2"
                          style={{
                            background: sc.bg,
                            border: `1px solid ${sc.c}22`,
                          }}
                        >
                          <div
                            className="mb-0.5 text-[10px] font-bold"
                            style={{ color: sc.c }}
                          >
                            {p.time ?? "9:00 AM"}
                          </div>
                          <div className="text-[11.5px] font-semibold leading-snug text-[#1e293b]">
                            {p.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : listItems.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#eceef4] bg-white">
          {listItems.map((item) => (
            <div
              key={`${item.day}-${item.title}`}
              className="flex items-center gap-4 border-b border-[#f1f3f8] px-5 py-4 last:border-0 hover:bg-[#fafbff]"
            >
              <div className="flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center rounded-[11px] bg-[#eef2ff]">
                <span className="text-[10px] font-bold text-[#4f46e5]">
                  {MONTH_ABBR[month]}
                </span>
                <span className="font-display text-lg font-extrabold text-[#4338ca]">
                  {item.day}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#1e293b]">
                  {item.title}
                </div>
                <div className="text-xs text-[#94a3b8]">
                  {item.time ?? "9:00 AM"} · Maya Reyes
                </div>
              </div>
              <StatusBadge status={item.status} />
              <div className="flex gap-1">
                {["edit", "content_copy", "send"].map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-lg"
                  >
                    <MsIcon name={icon} size={17} className="text-[#94a3b8]" />
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#eceef4] bg-white px-6 py-14 text-center">
          <MsIcon name="event_busy" size={36} className="mx-auto mb-3 text-[#cbd2e0]" />
          <p className="text-sm font-semibold text-[#64748b]">
            No posts for {monthLabel}
            {filter !== "All" ? ` matching “${filter}”` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
