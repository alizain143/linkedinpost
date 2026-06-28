import { Notification } from '@prisma/client';

export interface NotificationResponse {
  id: string;
  userId: string;
  workspaceId: string | null;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  nextCursor: string | null;
}

export function toNotificationResponse(
  notification: Notification,
): NotificationResponse {
  return {
    id: notification.id,
    userId: notification.userId,
    workspaceId: notification.workspaceId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actionUrl: notification.actionUrl,
    entityType: notification.entityType,
    entityId: notification.entityId,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}
