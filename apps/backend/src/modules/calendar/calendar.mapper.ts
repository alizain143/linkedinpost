import { PostPackage } from '@prisma/client';

export interface CalendarEvent {
  id: string;
  hook: string;
  pillar: string | null;
  status: PostPackage['status'];
  postType: PostPackage['postType'];
  scheduledAt: Date;
}

type CalendarPostRow = Pick<
  PostPackage,
  'id' | 'hook' | 'pillar' | 'status' | 'postType' | 'scheduledAt'
>;

export function toCalendarEvent(post: CalendarPostRow): CalendarEvent {
  return {
    id: post.id,
    hook: post.hook,
    pillar: post.pillar,
    status: post.status,
    postType: post.postType,
    scheduledAt: post.scheduledAt!,
  };
}
