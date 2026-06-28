import { BadRequestException } from '@nestjs/common';

export interface ScheduleValidationOptions {
  minLeadMinutes?: number;
  maxDays?: number;
  now?: Date;
}

const DEFAULT_MIN_LEAD_MINUTES = 15;
const DEFAULT_MAX_DAYS = 90;

export function validateScheduledAt(
  scheduledAt: Date | undefined,
  options?: ScheduleValidationOptions,
): void {
  if (!scheduledAt) {
    throw new BadRequestException({
      error: 'scheduledAt is required when scheduling a post',
      code: 'SCHEDULED_AT_REQUIRED',
    });
  }

  const now = options?.now ?? new Date();
  const minLeadMs =
    (options?.minLeadMinutes ?? DEFAULT_MIN_LEAD_MINUTES) * 60 * 1000;
  const maxMs = (options?.maxDays ?? DEFAULT_MAX_DAYS) * 24 * 60 * 60 * 1000;
  const scheduledMs = scheduledAt.getTime();
  const nowMs = now.getTime();

  if (scheduledMs <= nowMs) {
    throw new BadRequestException({
      error: 'scheduledAt must be in the future',
      code: 'VALIDATION_ERROR',
    });
  }

  if (scheduledMs < nowMs + minLeadMs) {
    throw new BadRequestException({
      error: `scheduledAt must be at least ${options?.minLeadMinutes ?? DEFAULT_MIN_LEAD_MINUTES} minutes from now`,
      code: 'SCHEDULE_TOO_SOON',
    });
  }

  if (scheduledMs > nowMs + maxMs) {
    throw new BadRequestException({
      error: `scheduledAt must be within ${options?.maxDays ?? DEFAULT_MAX_DAYS} days`,
      code: 'SCHEDULE_TOO_FAR',
    });
  }
}
