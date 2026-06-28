"use client";

import type { ApiAutopilotConfig } from "@/lib/api/types/autopilot";
import type { ApiPostPackage } from "@/lib/api/types/post";
import {
  formatAutopilotFrequency,
  formatNextRunAt,
  formatPlannedPostSchedule,
} from "@/lib/autopilot-utils";

type AutopilotStatusSummaryProps = {
  config: ApiAutopilotConfig;
  plannedPosts?: ApiPostPackage[];
  timezone: string;
  compact?: boolean;
};

export function getAutopilotStatusBadge(config: ApiAutopilotConfig): {
  label: string;
  active: boolean;
} {
  if (config.enabled) {
    return { label: "Active", active: true };
  }
  return { label: "Paused", active: false };
}

export function AutopilotStatusSummary({
  config,
  plannedPosts = [],
  timezone,
  compact = false,
}: AutopilotStatusSummaryProps) {
  const nextPublish = plannedPosts[0]?.scheduledAt;
  const frequency = formatAutopilotFrequency(config);
  const nextGeneration = formatNextRunAt(config.nextRunAt, timezone);

  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-[26px]"
          : "flex flex-wrap gap-6 text-sm"
      }
    >
      <div>
        <div
          className={
            compact
              ? "text-[11px] text-white/60"
              : "text-[11px] text-white/60"
          }
        >
          Frequency
        </div>
        <div
          className={
            compact
              ? "text-[13.5px] font-semibold"
              : "font-semibold"
          }
        >
          {frequency}
        </div>
      </div>
      <div>
        <div className="text-[11px] text-white/60">Next generation</div>
        <div
          className={
            compact
              ? "text-[13.5px] font-semibold"
              : "font-semibold"
          }
        >
          {config.enabled ? nextGeneration : "—"}
        </div>
      </div>
      <div>
        <div className="text-[11px] text-white/60">Next publish</div>
        <div
          className={
            compact
              ? "text-[13.5px] font-semibold"
              : "font-semibold"
          }
        >
          {nextPublish ? formatPlannedPostSchedule(nextPublish) : "—"}
        </div>
      </div>
    </div>
  );
}
