"use client";

import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import type { GenerationJobStatus } from "@/lib/api/types/enums";
import type {
  CouncilEvent,
  GenerationJobProgress,
} from "@/lib/api/types/generation";
import {
  formatAgentRole,
  formatDurationMs,
  shouldPollJob,
} from "@/lib/council-utils";

type CouncilTimelineProps = {
  events: CouncilEvent[];
  progress?: GenerationJobProgress | null;
  status?: GenerationJobStatus;
  errorMessage?: string | null;
  postPackageId?: string | null;
};

function eventStatusIcon(status: string) {
  if (status === "completed") return "check_circle";
  if (status === "failed") return "error";
  if (status === "running") return "progress_activity";
  return "radio_button_unchecked";
}

function eventStatusColor(status: string) {
  if (status === "completed") return "#16a34a";
  if (status === "failed") return "#dc2626";
  if (status === "running") return "#4f46e5";
  return "#94a3b8";
}

export function CouncilTimeline({
  events,
  progress,
  status,
  errorMessage,
  postPackageId,
}: CouncilTimelineProps) {
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
            <span>Pipeline progress</span>
            <span>{progress.percentComplete}%</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#eef2ff]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress.percentComplete))}%` }}
            />
          </div>
          {showActiveStep ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-[#4f46e5]">
              <MsIcon name="progress_activity" size={18} className="animate-ppspin" />
              {progress.currentLabel}
            </div>
          ) : null}
        </div>
      ) : null}

      {events.length > 0 ? (
        <div className="rounded-2xl border border-[#eceef4] bg-white p-[18px]">
          <h4 className="mb-4 font-display text-[15px] font-bold text-[#0f172a]">
            Agent timeline
          </h4>
          <ol className="flex flex-col gap-0">
            {events.map((event, index) => {
              const icon = eventStatusIcon(event.status);
              const color = eventStatusColor(event.status);
              const isLast = index === events.length - 1;

              return (
                <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {!isLast ? (
                    <span
                      aria-hidden
                      className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-[#e7e9f2]"
                    />
                  ) : null}
                  <span
                    className="relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f8f9fc]"
                    style={{ color }}
                  >
                    <MsIcon
                      name={icon}
                      size={16}
                      className={event.status === "running" ? "animate-ppspin" : undefined}
                    />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#4f46e5]">
                        {formatAgentRole(event.agentRole)}
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">
                        {formatDurationMs(event.durationMs)}
                      </span>
                    </div>
                    <p className="text-[13.5px] leading-snug text-[#334155]">
                      {event.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : showActiveStep ? (
        <div className="rounded-2xl border border-dashed border-[#d8dce8] bg-white px-6 py-10 text-center">
          <MsIcon
            name="progress_activity"
            size={28}
            className="mx-auto mb-3 animate-ppspin text-[#4f46e5]"
          />
          <p className="text-[14px] font-semibold text-[#475569]">
            Council agents are starting…
          </p>
        </div>
      ) : null}

      {status === "completed" && postPackageId ? (
        <div className="rounded-2xl border border-[#eceef4] bg-white p-[18px]">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#16a34a]">
            <MsIcon name="check_circle" size={19} />
            Council review complete
          </div>
          <Button href={`/app/posts/${postPackageId}`} variant="success" size="sm">
            <MsIcon name="open_in_new" size={16} />
            View post
          </Button>
        </div>
      ) : null}
    </div>
  );
}
