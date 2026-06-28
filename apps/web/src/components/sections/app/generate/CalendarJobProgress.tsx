"use client";

import Link from "next/link";
import { MsIcon } from "@/components/ui/ms-icon";
import { Button } from "@/components/ui/button";
import type { GenerationJobStatus } from "@/lib/api/types/enums";
import type {
  CalendarJobResult,
  GenerationJobProgress,
} from "@/lib/api/types/generation";
import { isCalendarJobResult } from "@/lib/calendar-generation-utils";
import { buildCalendarHighlightUrl } from "@/lib/generation-session";
import { formatCalendarEventTime } from "@/lib/calendar-utils";
import { shouldPollJob } from "@/lib/council-utils";
import { DEFAULT_TIMEZONE } from "@/lib/timezones";

type CalendarJobProgressProps = {
  progress?: GenerationJobProgress | null;
  status?: GenerationJobStatus;
  errorMessage?: string | null;
  result?: CalendarJobResult | null;
  timezone?: string;
};

export function CalendarJobProgressPanel({
  progress,
  status,
  errorMessage,
  result,
  timezone = DEFAULT_TIMEZONE,
}: CalendarJobProgressProps) {
  const calendarResult = isCalendarJobResult(result) ? result : null;
  const showActiveStep =
    !!progress &&
    !!status &&
    shouldPollJob(status) &&
    progress.currentLabel.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      {status === "failed" && errorMessage ? (
        <div className="rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-[13px] text-[#b91c1c]">
          {errorMessage}
        </div>
      ) : null}

      {progress ? (
        <div className="rounded-2xl border border-[#eceef4] bg-white p-[18px]">
          <div className="mb-2 flex items-center justify-between text-[12.5px] font-semibold text-[#475569]">
            <span>Calendar generation</span>
            <span>{progress.percentComplete}%</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#ecfeff]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0891b2] to-[#4f46e5] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, progress.percentComplete))}%`,
              }}
            />
          </div>
          {showActiveStep ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0891b2]">
              <MsIcon name="progress_activity" size={18} className="animate-ppspin" />
              {progress.currentLabel}
            </div>
          ) : null}
        </div>
      ) : null}

      {status === "completed" && calendarResult ? (
        <div className="rounded-2xl border border-[#eceef4] bg-white p-[18px]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#16a34a]">
            <MsIcon name="check_circle" size={19} />
            {calendarResult.slotCount} posts planned
          </div>
          <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
            {calendarResult.slots.map((slot) => (
              <div
                key={slot.postPackageId}
                className="rounded-[11px] border border-[#f1f3f8] bg-[#fbfbfd] px-3.5 py-3"
              >
                <p className="text-[13.5px] font-semibold text-[#1e293b]">
                  {slot.topic}
                </p>
                <p className="mt-1 text-[12px] text-[#64748b]">
                  {new Intl.DateTimeFormat(undefined, {
                    timeZone: timezone,
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(slot.scheduledAt))}{" "}
                  · {formatCalendarEventTime(slot.scheduledAt, timezone)}
                  {slot.pillar ? ` · ${slot.pillar}` : ""}
                </p>
              </div>
            ))}
          </div>
          <Button
            href={buildCalendarHighlightUrl(calendarResult.slots)}
            variant="success"
            size="sm"
          >
            <MsIcon name="event_available" size={16} />
            Show in calendar
          </Button>
        </div>
      ) : showActiveStep && !calendarResult ? (
        <div className="rounded-2xl border border-dashed border-[#d8dce8] bg-white px-6 py-10 text-center">
          <MsIcon
            name="calendar_month"
            size={28}
            className="mx-auto mb-3 animate-ppspin text-[#0891b2]"
          />
          <p className="text-[14px] font-semibold text-[#475569]">
            Planning your calendar…
          </p>
        </div>
      ) : null}

      {status === "completed" && !calendarResult ? (
        <div className="rounded-[11px] border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-3 text-[13px] text-[#166534]">
          Calendar generation finished.{" "}
          <Link
            href="/app/calendar?filter=Needs%20Approval"
            className="font-semibold text-[#0891b2]"
          >
            Show in calendar
          </Link>
        </div>
      ) : null}
    </div>
  );
}
