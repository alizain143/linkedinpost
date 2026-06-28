import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiNotification,
  ApiNotificationList,
  ApiUnreadCount,
} from "@/lib/api/types/notification";

export type NotificationsQuery = {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
};

export async function fetchNotifications(
  token: string,
  query: NotificationsQuery = {},
): Promise<ApiNotificationList> {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.unreadOnly) params.set("unreadOnly", "true");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<ApiNotificationList>(token, `/notifications${suffix}`);
}

export async function fetchUnreadNotificationCount(
  token: string,
): Promise<ApiUnreadCount> {
  return apiFetch<ApiUnreadCount>(token, "/notifications/unread-count");
}

export async function markNotificationRead(
  token: string,
  notificationId: string,
): Promise<ApiNotification> {
  return apiFetch<ApiNotification>(
    token,
    `/notifications/${notificationId}/read`,
    { method: "PATCH" },
  );
}

export async function markAllNotificationsRead(
  token: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(token, "/notifications/read-all", {
    method: "POST",
  });
}

export async function registerPushDevice(
  token: string,
  body: { token: string; userAgent?: string },
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(token, "/notifications/devices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function revokePushDevice(
  token: string,
  deviceToken: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    token,
    `/notifications/devices/${encodeURIComponent(deviceToken)}`,
    { method: "DELETE" },
  );
}
