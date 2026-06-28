import { ConflictException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';

export const SCHEDULE_TRANSITIONS: Record<
  PostPackageStatus,
  PostPackageStatus[]
> = {
  [PostPackageStatus.draft]: [],
  [PostPackageStatus.text_generating]: [],
  [PostPackageStatus.text_reviewing]: [],
  [PostPackageStatus.media_generating]: [],
  [PostPackageStatus.ready_for_approval]: [],
  [PostPackageStatus.approved]: [PostPackageStatus.scheduled],
  [PostPackageStatus.scheduled]: [PostPackageStatus.approved],
  [PostPackageStatus.publishing]: [],
  [PostPackageStatus.published]: [],
  [PostPackageStatus.failed]: [],
};

export function assertScheduleTransition(
  from: PostPackageStatus,
  to: PostPackageStatus,
): void {
  const allowed = SCHEDULE_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new ConflictException({
      error: `Cannot schedule transition from ${from} to ${to}`,
      code: 'INVALID_STATUS_TRANSITION',
    });
  }
}
