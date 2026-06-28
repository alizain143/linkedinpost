import { AutopilotConfig, PostPackageStatus } from '@prisma/client';
import {
  AutopilotPostingPreset,
  computeNextGenerationAt,
  computeNextPlannedSlot,
  derivePostingPresetLabel,
} from './autopilot-schedule.util';
import {
  DayProfileOverrides,
  readDayProfileOverrides,
} from './autopilot-profile.util';

export type AutopilotPublishState =
  | 'awaiting_approval'
  | 'approved'
  | 'scheduled_for_linkedin';

export interface AutopilotConfigResponse {
  enabled: boolean;
  postingPreset: AutopilotPostingPreset | 'custom';
  postingDays: number[];
  postingTime: string;
  contentProfileId: string | null;
  dayProfileOverrides: DayProfileOverrides | null;
  approvalMode: 'require_approval' | 'auto_schedule';
  status: 'active' | 'inactive';
  timezone: string;
  nextRunAt: string | null;
  nextGenerationState: 'due_now' | 'scheduled' | 'paused';
  nextPlannedSlot: string | null;
  lastRunDateKey: string | null;
}

export interface AutopilotPlannedPostResponse {
  publishState: AutopilotPublishState;
}

export function toAutopilotPublishState(
  status: PostPackageStatus,
): AutopilotPublishState {
  switch (status) {
    case PostPackageStatus.ready_for_approval:
      return 'awaiting_approval';
    case PostPackageStatus.approved:
      return 'approved';
    case PostPackageStatus.scheduled:
      return 'scheduled_for_linkedin';
    default:
      return 'awaiting_approval';
  }
}

export function toAutopilotConfigResponse(
  config: AutopilotConfig,
  timezone: string,
  now = new Date(),
): AutopilotConfigResponse {
  const nextGeneration = computeNextGenerationAt(config, timezone, now);
  const nextPlannedSlot = computeNextPlannedSlot(
    config.postingDays,
    config.postingTime,
    timezone,
    now,
  );

  return {
    enabled: config.enabled,
    postingPreset: derivePostingPresetLabel(config.postingDays),
    postingDays: config.postingDays,
    postingTime: config.postingTime,
    contentProfileId: config.contentProfileId,
    dayProfileOverrides: readDayProfileOverrides(config.dayProfileOverrides),
    approvalMode: config.approvalMode,
    status: config.enabled ? 'active' : 'inactive',
    timezone,
    nextRunAt: nextGeneration.at?.toISOString() ?? null,
    nextGenerationState: nextGeneration.state,
    nextPlannedSlot: nextPlannedSlot?.toISOString() ?? null,
    lastRunDateKey: config.lastRunDateKey,
  };
}
