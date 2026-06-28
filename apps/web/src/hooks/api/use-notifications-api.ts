"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  registerPushDevice,
  revokePushDevice,
  type NotificationsQuery,
} from "@/lib/api/notifications";
import { queryKeys } from "@/lib/api/query-keys";
import { invalidateNotificationQueries } from "@/lib/notification-query-invalidation";
import type { ApiUnreadCount } from "@/lib/api/types/notification";

const NOTIFICATION_POLL_MS = 30_000;
const INBOX_PAGE_SIZE = 20;

type UseNotificationsOptions = NotificationsQuery & {
  enabled?: boolean;
};

function decrementUnreadCount(count: number) {
  return Math.max(0, count - 1);
}

export function useInvalidateNotifications() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    invalidateNotificationQueries(queryClient);
  }, [queryClient]);
}

export function useNotifications(
  query: UseNotificationsOptions = { limit: 10 },
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { enabled = true, ...fetchQuery } = query;

  return useQuery({
    queryKey: queryKeys.notifications.list(fetchQuery),
    enabled: isLoaded && isSignedIn && enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchNotifications(token, fetchQuery);
    },
  });
}

export function useNotificationsInfinite(unreadOnly = false) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const params = { unreadOnly, limit: INBOX_PAGE_SIZE };

  return useInfiniteQuery({
    queryKey: queryKeys.notifications.infinite(params),
    enabled: isLoaded && isSignedIn,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchNotifications(token, {
        limit: INBOX_PAGE_SIZE,
        unreadOnly,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUnreadNotificationCount() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    enabled: isLoaded && isSignedIn,
    refetchInterval: NOTIFICATION_POLL_MS,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchUnreadNotificationCount(token);
    },
  });
}

export function useMarkNotificationRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return markNotificationRead(token, notificationId);
    },
    onSuccess: () => {
      queryClient.setQueryData<ApiUnreadCount>(
        queryKeys.notifications.unreadCount,
        (current) => ({
          count: decrementUnreadCount(current?.count ?? 0),
        }),
      );
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return markAllNotificationsRead(token);
    },
    onSuccess: () => {
      queryClient.setQueryData<ApiUnreadCount>(
        queryKeys.notifications.unreadCount,
        { count: 0 },
      );
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useRegisterPushDevice() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (deviceToken: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return registerPushDevice(token, {
        token: deviceToken,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
    },
  });
}

export function useRevokePushDevice() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (deviceToken: string) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return revokePushDevice(token, deviceToken);
    },
  });
}
