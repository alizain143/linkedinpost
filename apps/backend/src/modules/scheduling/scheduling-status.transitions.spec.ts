import { PostPackageStatus } from '@prisma/client';
import {
  assertScheduleTransition,
  SCHEDULE_TRANSITIONS,
} from './scheduling-status.transitions';

describe('scheduling status transitions', () => {
  it('allows approved to scheduled', () => {
    expect(() =>
      assertScheduleTransition(
        PostPackageStatus.approved,
        PostPackageStatus.scheduled,
      ),
    ).not.toThrow();
  });

  it('allows scheduled to approved', () => {
    expect(() =>
      assertScheduleTransition(
        PostPackageStatus.scheduled,
        PostPackageStatus.approved,
      ),
    ).not.toThrow();
  });

  it('blocks draft to scheduled', () => {
    expect(() =>
      assertScheduleTransition(
        PostPackageStatus.draft,
        PostPackageStatus.scheduled,
      ),
    ).toThrow();
  });

  it('defines empty transitions for non-scheduling statuses', () => {
    expect(SCHEDULE_TRANSITIONS[PostPackageStatus.draft]).toEqual([]);
  });
});
