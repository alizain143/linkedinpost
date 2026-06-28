"use client";

import type { ApiAutopilotConfig, ApiAutopilotPlannedPost } from "@/lib/api/types/autopilot";
import {
  formatApprovalModeLabel,
  formatAutopilotFrequency,
  formatNextLinkedInPublish,
  formatNextRunAt,
} from "@/lib/autopilot-utils";

type AutopilotStatusSummaryProps = {
  config: ApiAutopilotConfig;
  plannedPosts?: ApiAutopilotPlannedPost[];
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
  compact = false,
}: AutopilotStatusSummaryProps) {
  const timezone = config.timezone;
  const frequency = formatAutopilotFrequency(config);
  const nextGeneration = formatNextRunAt(
    config.nextRunAt,
    timezone,
    config.nextGenerationState,
  );
  const nextPublish = formatNextLinkedInPublish({ config, plannedPosts });

  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-[26px]"
          : "flex flex-wrap gap-6 text-sm"
      }
    >
      <div>
        <div className="text-[11px] text-white/60">Frequency</div>
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
        <div className="text-[11px] text-white/60">Approval mode</div>
        <div
          className={
            compact
              ? "text-[13.5px] font-semibold"
              : "font-semibold"
          }
        >
          {formatApprovalModeLabel(config.approvalMode)}
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
        <div className="text-[11px] text-white/60">Next LinkedIn publish</div>
        <div
          className={
            compact
              ? "text-[13.5px] font-semibold"
              : "font-semibold"
          }
        >
          {nextPublish.primary}
        </div>
        {nextPublish.secondary ? (
          <div className="mt-0.5 text-[11px] text-white/60">
            {nextPublish.secondary}
          </div>
        ) : null}
      </div>
    </div>
  );
}
