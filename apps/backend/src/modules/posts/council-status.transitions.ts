import { ConflictException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';

export const COUNCIL_STATUS_TRANSITIONS: Record<
  PostPackageStatus,
  PostPackageStatus[]
> = {
  [PostPackageStatus.draft]: [PostPackageStatus.media_generating],
  [PostPackageStatus.text_generating]: [
    PostPackageStatus.text_reviewing,
    PostPackageStatus.failed,
  ],
  [PostPackageStatus.text_reviewing]: [
    PostPackageStatus.text_generating,
    PostPackageStatus.awaiting_media_selection,
    PostPackageStatus.media_generating,
    PostPackageStatus.failed,
  ],
  [PostPackageStatus.awaiting_media_selection]: [
    PostPackageStatus.media_generating,
    PostPackageStatus.failed,
  ],
  [PostPackageStatus.media_generating]: [
    PostPackageStatus.ready_for_approval,
    PostPackageStatus.draft,
    PostPackageStatus.failed,
  ],
  [PostPackageStatus.ready_for_approval]: [],
  [PostPackageStatus.approved]: [],
  [PostPackageStatus.scheduled]: [],
  [PostPackageStatus.publishing]: [],
  [PostPackageStatus.published]: [],
  [PostPackageStatus.failed]: [PostPackageStatus.text_generating],
};

export function assertCouncilStatusTransition(
  from: PostPackageStatus,
  to: PostPackageStatus,
): void {
  const allowed = COUNCIL_STATUS_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new ConflictException({
      error: `Cannot transition council post from ${from} to ${to}`,
      code: 'INVALID_STATUS_TRANSITION',
    });
  }
}
