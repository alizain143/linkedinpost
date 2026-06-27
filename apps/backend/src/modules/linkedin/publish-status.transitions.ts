import { ConflictException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';

export const PUBLISH_SOURCE_STATUSES: PostPackageStatus[] = [
  PostPackageStatus.approved,
  PostPackageStatus.scheduled,
  PostPackageStatus.failed,
];

export function assertPublishTransition(
  from: PostPackageStatus,
  publishErrorCode?: string | null,
): void {
  if (!PUBLISH_SOURCE_STATUSES.includes(from)) {
    throw new ConflictException({
      error: `Cannot publish post in status ${from}`,
      code: 'INVALID_STATUS_TRANSITION',
    });
  }

  if (from === PostPackageStatus.failed && !publishErrorCode) {
    throw new ConflictException({
      error: 'Cannot retry publish for a non-publish failure',
      code: 'INVALID_STATUS_TRANSITION',
    });
  }
}
