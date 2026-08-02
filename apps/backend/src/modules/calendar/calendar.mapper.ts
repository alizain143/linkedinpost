import { PostPackage, PostPackageStatus } from '@prisma/client';
import { PostMediaResponse } from '../media/media.types';

export interface CalendarEvent {
  id: string;
  hook: string;
  pillar: string | null;
  status: PostPackage['status'];
  postType: PostPackage['postType'];
  scheduledAt: Date;
  media: PostMediaResponse[];
}

type CalendarPostRow = Pick<
  PostPackage,
  | 'id'
  | 'hook'
  | 'pillar'
  | 'status'
  | 'postType'
  | 'scheduledAt'
  | 'publishedAt'
>;

export function toCalendarEvent(
  post: CalendarPostRow,
  media: PostMediaResponse[] = [],
): CalendarEvent {
  const scheduledAt =
    post.status === PostPackageStatus.published
      ? (post.publishedAt ?? post.scheduledAt)
      : post.scheduledAt;

  return {
    id: post.id,
    hook: post.hook,
    pillar: post.pillar,
    status: post.status,
    postType: post.postType,
    scheduledAt: scheduledAt!,
    media,
  };
}
