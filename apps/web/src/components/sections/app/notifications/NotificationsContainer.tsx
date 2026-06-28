"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
  useUnreadNotificationCount,
} from "@/hooks/api/use-notifications-api";
import {
  parseNotificationActionPath,
  parseNotificationFilter,
  type NotificationFilter,
} from "@/lib/notification-utils";
import type { ApiNotification } from "@/lib/api/types/notification";
import type { NotificationsContainerProps } from "./types";

export function useNotificationsContainer(): NotificationsContainerProps {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = parseNotificationFilter(searchParams.get("filter"));
  const unreadOnly = filter === "unread";

  const { data: unreadData } = useUnreadNotificationCount();
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsInfinite(unreadOnly);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const onFilterChange = useCallback(
    (nextFilter: NotificationFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextFilter === "unread") {
        params.set("filter", "unread");
      } else {
        params.delete("filter");
      }
      const query = params.toString();
      router.replace(query ? `/app/notifications?${query}` : "/app/notifications");
    },
    [router, searchParams],
  );

  const onNotificationClick = useCallback(
    async (notification: ApiNotification) => {
      if (!notification.readAt) {
        await markRead.mutateAsync(notification.id);
      }
      const path = parseNotificationActionPath(notification.actionUrl);
      if (path) {
        router.push(path);
      }
    },
    [markRead, router],
  );

  return {
    filter,
    notifications,
    unreadCount: unreadData?.count ?? 0,
    isLoading,
    isError,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    onFilterChange,
    onRetry: () => void refetch(),
    onLoadMore: () => void fetchNextPage(),
    onMarkAllRead: () => void markAllRead.mutateAsync(),
    onNotificationClick: (notification) => void onNotificationClick(notification),
    isMarkingAllRead: markAllRead.isPending,
  };
}
