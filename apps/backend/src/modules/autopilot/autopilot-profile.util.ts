import { BadRequestException } from '@nestjs/common';

export type DayProfileOverrides = Record<string, string>;

export function parseDayProfileOverrides(
  value: unknown,
): DayProfileOverrides | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException({
      error: 'dayProfileOverrides must be an object',
      code: 'VALIDATION_ERROR',
    });
  }

  const result: DayProfileOverrides = {};

  for (const [key, profileId] of Object.entries(value)) {
    const weekday = Number(key);
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
      throw new BadRequestException({
        error: 'dayProfileOverrides keys must be ISO weekdays 1–7',
        code: 'VALIDATION_ERROR',
      });
    }

    if (typeof profileId !== 'string' || profileId.length === 0) {
      throw new BadRequestException({
        error: 'dayProfileOverrides values must be profile UUIDs',
        code: 'VALIDATION_ERROR',
      });
    }

    result[String(weekday)] = profileId;
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function readDayProfileOverrides(
  value: unknown,
): DayProfileOverrides | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const result: DayProfileOverrides = {};

  for (const [key, profileId] of Object.entries(value)) {
    const weekday = Number(key);
    if (
      Number.isInteger(weekday) &&
      weekday >= 1 &&
      weekday <= 7 &&
      typeof profileId === 'string' &&
      profileId.length > 0
    ) {
      result[String(weekday)] = profileId;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function resolveProfileIdForWeekday(
  weekday: number,
  contentProfileId: string | null,
  dayProfileOverrides: DayProfileOverrides | null,
): string | null {
  const overrideId = dayProfileOverrides?.[String(weekday)];
  return overrideId ?? contentProfileId;
}

export function collectReferencedProfileIds(
  contentProfileId: string | null,
  dayProfileOverrides: DayProfileOverrides | null,
): string[] {
  const ids = new Set<string>();

  if (contentProfileId) {
    ids.add(contentProfileId);
  }

  if (dayProfileOverrides) {
    for (const profileId of Object.values(dayProfileOverrides)) {
      ids.add(profileId);
    }
  }

  return [...ids];
}
