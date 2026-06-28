import { QueryState } from "@/components/app/query-state";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import type { ApiNotification } from "@/lib/api/types/notification";
import {
  formatNotificationTime,
  getNotificationIcon,
  type NotificationFilter,
} from "@/lib/notification-utils";
import type { NotificationsContainerProps } from "./types";

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-2xl border border-[#eceef4] bg-white"
        />
      ))}
    </div>
  );
}

function FilterBar({
  filter,
  onFilterChange,
}: {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
}) {
  const tabs: Array<{ id: NotificationFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
  ];

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => {
        const active = filter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              active
                ? "bg-[#eef2ff] text-[#4338ca]"
                : "bg-white text-[#64748b] hover:bg-[#f6f7fb]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: ApiNotification;
  onClick: () => void;
}) {
  const icon = getNotificationIcon(notification.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full gap-3 rounded-2xl border border-[#eceef4] bg-white px-4 py-3.5 text-left transition-colors hover:bg-[#f6f7fb]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff]">
        <MsIcon name={icon} size={18} className="text-[#4f46e5]" />
      </div>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className="block flex-1 text-[14px] font-semibold text-[#1e293b]">
            {notification.title}
          </span>
          {!notification.readAt ? (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4f46e5]" />
          ) : null}
        </span>
        <span className="mt-0.5 block text-[13px] text-[#64748b]">
          {notification.body}
        </span>
        <span className="mt-1 block text-[12px] text-[#94a3b8]">
          {formatNotificationTime(notification.createdAt)}
        </span>
      </span>
    </button>
  );
}

function EmptyState({ filter }: { filter: NotificationFilter }) {
  return (
    <div className="rounded-2xl border border-[#eceef4] bg-white px-6 py-12 text-center">
      <MsIcon
        name="notifications_none"
        size={32}
        className="mx-auto mb-3 text-[#cbd5e1]"
      />
      <p className="text-[14px] font-semibold text-[#64748b]">
        {filter === "unread"
          ? "You're all caught up"
          : "No notifications yet"}
      </p>
      <p className="mt-1 text-[13px] text-[#94a3b8]">
        {filter === "unread"
          ? "Unread alerts will show up here."
          : "Approval updates and publish alerts will appear here."}
      </p>
    </div>
  );
}

export function NotificationsView(props: NotificationsContainerProps) {
  return (
    <div className="mx-auto max-w-[720px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0f172a]">
            Notifications
          </h2>
          <p className="mt-1 text-[13px] text-[#64748b]">
            Updates on generation, approvals, and publishing.
          </p>
        </div>
        {props.unreadCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={props.isMarkingAllRead}
            onClick={props.onMarkAllRead}
          >
            Mark all read
          </Button>
        ) : null}
      </div>

      <FilterBar filter={props.filter} onFilterChange={props.onFilterChange} />

      <QueryState
        isLoading={props.isLoading}
        error={props.isError ? new Error("Failed to load notifications") : null}
        onRetry={props.onRetry}
        skeleton={<NotificationsSkeleton />}
      >
        {props.notifications.length === 0 ? (
          <EmptyState filter={props.filter} />
        ) : (
          <div className="space-y-3">
            {props.notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onClick={() => props.onNotificationClick(notification)}
              />
            ))}
            {props.hasNextPage ? (
              <div className="pt-2 text-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={props.isFetchingNextPage}
                  onClick={props.onLoadMore}
                >
                  {props.isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </QueryState>
    </div>
  );
}
