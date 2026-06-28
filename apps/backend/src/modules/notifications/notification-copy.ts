import { NotificationType } from '@prisma/client';

export interface NotificationCopyInput {
  type: NotificationType;
  postHook?: string | null;
  workspaceName?: string | null;
}

export interface NotificationCopy {
  title: string;
  body: string;
}

export function buildNotificationCopy(
  input: NotificationCopyInput,
): NotificationCopy {
  const hook = input.postHook?.trim() || 'your post';

  switch (input.type) {
    case NotificationType.generation_complete:
      return {
        title: 'Generation complete',
        body: `"${hook}" is ready for review.`,
      };
    case NotificationType.post_ready_for_approval:
      return {
        title: 'Ready for approval',
        body: `"${hook}" is waiting for your approval.`,
      };
    case NotificationType.client_approved:
      return {
        title: 'Client approved',
        body: `Your client approved "${hook}".`,
      };
    case NotificationType.client_requested_changes:
      return {
        title: 'Client requested changes',
        body: `Your client requested changes on "${hook}".`,
      };
    case NotificationType.publish_succeeded:
      return {
        title: 'Published to LinkedIn',
        body: `"${hook}" was published successfully.`,
      };
    case NotificationType.publish_failed:
      return {
        title: 'Publish failed',
        body: `"${hook}" could not be published. Action needed.`,
      };
    case NotificationType.weekly_content_reminder:
      return {
        title: 'Weekly content reminder',
        body: "It's time to plan this week's LinkedIn content.",
      };
    case NotificationType.product_update:
      return {
        title: 'Product update',
        body: 'New features and tips from linkedinpost.ai.',
      };
    default:
      return {
        title: 'Notification',
        body: 'You have a new update.',
      };
  }
}

export function buildEmailSubject(type: NotificationType): string {
  switch (type) {
    case NotificationType.generation_complete:
      return 'Your post is ready for review';
    case NotificationType.post_ready_for_approval:
      return 'New post awaiting your approval';
    case NotificationType.client_approved:
      return 'Client approved your post';
    case NotificationType.client_requested_changes:
      return 'Client requested changes on your post';
    case NotificationType.publish_succeeded:
      return 'Published to LinkedIn';
    case NotificationType.publish_failed:
      return 'Publish failed — action needed';
    case NotificationType.weekly_content_reminder:
      return "Time to plan this week's content";
    case NotificationType.product_update:
      return 'Product update from linkedinpost.ai';
    default:
      return 'Notification from linkedinpost.ai';
  }
}

export { buildEmailHtml, buildEmailText } from './email-template';
