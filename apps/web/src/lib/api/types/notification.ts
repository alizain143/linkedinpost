export type NotificationType =
  | "generation_complete"
  | "post_ready_for_approval"
  | "client_approved"
  | "client_requested_changes"
  | "publish_succeeded"
  | "publish_failed"
  | "weekly_content_reminder"
  | "product_update";

export type ApiNotification = {
  id: string;
  userId: string;
  workspaceId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ApiNotificationList = {
  items: ApiNotification[];
  nextCursor: string | null;
};

export type ApiUnreadCount = {
  count: number;
};
