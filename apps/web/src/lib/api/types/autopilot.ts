export type AutopilotPostingPreset =
  | "three_per_week"
  | "daily"
  | "weekdays"
  | "weekly";

export type AutopilotPostingPresetLabel =
  | AutopilotPostingPreset
  | "custom";

export type AutopilotConfigStatus = "active" | "inactive";

export type ApiAutopilotConfig = {
  enabled: boolean;
  postingPreset: AutopilotPostingPresetLabel;
  postingDays: number[];
  postingTime: string;
  contentProfileId: string | null;
  status: AutopilotConfigStatus;
  nextRunAt: string | null;
  lastRunDateKey: string | null;
};

export type UpsertAutopilotConfigBody = {
  enabled?: boolean;
  contentProfileId?: string;
  postingPreset?: AutopilotPostingPreset;
  postingDays?: number[];
  postingTime?: string;
};
