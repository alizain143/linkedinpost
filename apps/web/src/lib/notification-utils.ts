import type { NotificationType } from "@/lib/api/types/notification";

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  generation_complete: "auto_awesome",
  post_ready_for_approval: "fact_check",
  client_approved: "check_circle",
  client_requested_changes: "rate_review",
  publish_succeeded: "check_circle",
  publish_failed: "error",
  weekly_content_reminder: "calendar_month",
  product_update: "mail",
};

export function getNotificationIcon(type: NotificationType): string {
  return NOTIFICATION_ICONS[type] ?? "notifications";
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function parseNotificationActionPath(
  actionUrl: string | null,
): string | null {
  if (!actionUrl?.trim()) return null;

  if (actionUrl.startsWith("/")) {
    return actionUrl;
  }

  try {
    const url = new URL(actionUrl);
    if (typeof window !== "undefined") {
      if (url.origin !== window.location.origin) {
        return null;
      }
    } else {
      const localOrigins = new Set(["http://localhost:3000", "http://localhost"]);
      if (!localOrigins.has(url.origin)) {
        return null;
      }
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export type NotificationFilter = "all" | "unread";

export function parseNotificationFilter(
  value: string | null | undefined,
): NotificationFilter {
  return value === "unread" ? "unread" : "all";
}
