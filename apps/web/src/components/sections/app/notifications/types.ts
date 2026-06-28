import type { ApiNotification } from "@/lib/api/types/notification";
import type { NotificationFilter } from "@/lib/notification-utils";

export type NotificationsContainerProps = {
  filter: NotificationFilter;
  notifications: ApiNotification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFilterChange: (filter: NotificationFilter) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notification: ApiNotification) => void;
  isMarkingAllRead: boolean;
};
