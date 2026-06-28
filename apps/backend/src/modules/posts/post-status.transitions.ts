import { ConflictException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';

export const ALLOWED_TRANSITIONS: Record<
  PostPackageStatus,
  PostPackageStatus[]
> = {
  [PostPackageStatus.draft]: [
    PostPackageStatus.ready_for_approval,
    PostPackageStatus.approved,
  ],
  [PostPackageStatus.text_generating]: [],
  [PostPackageStatus.text_reviewing]: [],
  [PostPackageStatus.media_generating]: [],
  [PostPackageStatus.ready_for_approval]: [
    PostPackageStatus.approved,
    PostPackageStatus.draft,
  ],
  [PostPackageStatus.approved]: [
    PostPackageStatus.ready_for_approval,
    PostPackageStatus.draft,
  ],
  [PostPackageStatus.scheduled]: [
    PostPackageStatus.approved,
    PostPackageStatus.draft,
  ],
  [PostPackageStatus.publishing]: [],
  [PostPackageStatus.published]: [],
  [PostPackageStatus.failed]: [PostPackageStatus.draft],
};

export const PIPELINE_COLUMN_ORDER: PostPackageStatus[] = [
  PostPackageStatus.draft,
  PostPackageStatus.text_generating,
  PostPackageStatus.text_reviewing,
  PostPackageStatus.media_generating,
  PostPackageStatus.ready_for_approval,
  PostPackageStatus.approved,
  PostPackageStatus.scheduled,
  PostPackageStatus.publishing,
  PostPackageStatus.published,
  PostPackageStatus.failed,
];

export const PIPELINE_LABELS: Record<PostPackageStatus, string> = {
  [PostPackageStatus.draft]: 'Draft',
  [PostPackageStatus.text_generating]: 'Text Generating',
  [PostPackageStatus.text_reviewing]: 'Text Reviewing',
  [PostPackageStatus.media_generating]: 'Media Generating',
  [PostPackageStatus.ready_for_approval]: 'Ready for Approval',
  [PostPackageStatus.approved]: 'Approved',
  [PostPackageStatus.scheduled]: 'Scheduled',
  [PostPackageStatus.publishing]: 'Publishing',
  [PostPackageStatus.published]: 'Published',
  [PostPackageStatus.failed]: 'Failed',
};

export function assertValidTransition(
  from: PostPackageStatus,
  to: PostPackageStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new ConflictException({
      error: `Cannot transition from ${from} to ${to}`,
      code: 'INVALID_STATUS_TRANSITION',
    });
  }
}
