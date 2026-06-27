import { AutopilotConfig } from '@prisma/client';
import { computeNextRunAt } from './autopilot-schedule.util';

export interface AutopilotConfigResponse {
  enabled: boolean;
  frequency: AutopilotConfig['frequency'];
  postingDays: number[];
  postingTime: string;
  contentProfileId: string | null;
  status: 'active' | 'inactive';
  nextRunAt: string | null;
  lastRunDateKey: string | null;
}

export function toAutopilotConfigResponse(
  config: AutopilotConfig,
  timezone: string,
  now = new Date(),
): AutopilotConfigResponse {
  const nextRunAt = config.enabled
    ? computeNextRunAt(config.postingDays, config.postingTime, timezone, now)
    : null;

  return {
    enabled: config.enabled,
    frequency: config.frequency,
    postingDays: config.postingDays,
    postingTime: config.postingTime,
    contentProfileId: config.contentProfileId,
    status: config.enabled ? 'active' : 'inactive',
    nextRunAt: nextRunAt?.toISOString() ?? null,
    lastRunDateKey: config.lastRunDateKey,
  };
}
