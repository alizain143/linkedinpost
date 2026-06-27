import { BadRequestException } from '@nestjs/common';
import { validateScheduledAt } from './scheduling.validation';

describe('validateScheduledAt', () => {
  const now = new Date('2026-06-27T12:00:00.000Z');

  it('throws when scheduledAt is missing', () => {
    expect(() =>
      validateScheduledAt(undefined, { now, minLeadMinutes: 15, maxDays: 90 }),
    ).toThrow(BadRequestException);
  });

  it('throws when scheduledAt is in the past', () => {
    expect(() =>
      validateScheduledAt(new Date('2026-06-27T11:00:00.000Z'), {
        now,
        minLeadMinutes: 15,
        maxDays: 90,
      }),
    ).toThrow(BadRequestException);
  });

  it('throws when scheduledAt is too soon', () => {
    expect(() =>
      validateScheduledAt(new Date('2026-06-27T12:10:00.000Z'), {
        now,
        minLeadMinutes: 15,
        maxDays: 90,
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'SCHEDULE_TOO_SOON' }),
      }),
    );
  });

  it('throws when scheduledAt is too far', () => {
    expect(() =>
      validateScheduledAt(new Date('2026-12-27T12:00:00.000Z'), {
        now,
        minLeadMinutes: 15,
        maxDays: 90,
      }),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({ code: 'SCHEDULE_TOO_FAR' }),
      }),
    );
  });

  it('accepts a valid scheduledAt', () => {
    expect(() =>
      validateScheduledAt(new Date('2026-06-28T12:00:00.000Z'), {
        now,
        minLeadMinutes: 15,
        maxDays: 90,
      }),
    ).not.toThrow();
  });
});
