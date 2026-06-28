import type { ApiPostPackage } from "@/lib/api/types/post";

export type AutopilotPostingPreset =
  | "three_per_week"
  | "daily"
  | "weekdays"
  | "weekly";

export type AutopilotPostingPresetLabel =
  | AutopilotPostingPreset
  | "custom";

export type AutopilotConfigStatus = "active" | "inactive";

export type AutopilotApprovalMode = "require_approval" | "auto_schedule";

export type AutopilotGenerationState = "due_now" | "scheduled" | "paused";

export type AutopilotPublishState =
  | "awaiting_approval"
  | "approved"
  | "scheduled_for_linkedin";

export type DayProfileOverrides = Record<string, string>;

export type ApiAutopilotConfig = {
  enabled: boolean;
  postingPreset: AutopilotPostingPresetLabel;
  postingDays: number[];
  postingTime: string;
  contentProfileId: string | null;
  dayProfileOverrides: DayProfileOverrides | null;
  approvalMode: AutopilotApprovalMode;
  status: AutopilotConfigStatus;
  timezone: string;
  nextRunAt: string | null;
  nextGenerationState: AutopilotGenerationState;
  nextPlannedSlot: string | null;
  lastRunDateKey: string | null;
};

export type ApiAutopilotPlannedPost = ApiPostPackage & {
  publishState: AutopilotPublishState;
};

export type UpsertAutopilotConfigBody = {
  enabled?: boolean;
  contentProfileId?: string;
  dayProfileOverrides?: DayProfileOverrides;
  approvalMode?: AutopilotApprovalMode;
  postingPreset?: AutopilotPostingPreset;
  postingDays?: number[];
  postingTime?: string;
};
