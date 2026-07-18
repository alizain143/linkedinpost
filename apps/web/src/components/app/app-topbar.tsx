"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MsIcon } from "@/components/ui/ms-icon";
import { QUICK_DRAFT_CREDIT_COST } from "@/lib/credit-costs";
import { useCredits } from "@/hooks/api/use-credits-api";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/api/use-notifications-api";
import {
  formatNotificationTime,
  getNotificationIcon,
  parseNotificationActionPath,
} from "@/lib/notification-utils";
import { useAppUi } from "@/providers/app-ui-provider";

type AppTopbarProps = {
  title: string;
  onMenuClick: () => void;
};

export function AppTopbar({ title, onMenuClick }: AppTopbarProps) {
  const router = useRouter();
  const { linkedinConnectionState, openConnect } = useAppUi();
  const { canAfford, isLoading: creditsLoading } = useCredits();
  const canGeneratePost = creditsLoading || canAfford(QUICK_DRAFT_CREDIT_COST);
  const [notifOpen, setNotifOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const genRef = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadNotificationCount();
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useNotifications({ limit: 10 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.items ?? [];

  const blockGenerate = (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    setGenOpen(false);
    router.push("/app/billing");
  };

  const handleGenerateToggle = () => {
    if (!canGeneratePost) {
      blockGenerate();
      return;
    }
    setGenOpen((value) => !value);
  };

  const handleGeneratePostClick = (event: React.MouseEvent) => {
    if (!canGeneratePost) {
      blockGenerate(event);
    } else {
      setGenOpen(false);
    }
  };

  const handleNotificationToggle = () => {
    setNotifOpen((open) => {
      const next = !open;
      if (next) {
        void refetchNotifications();
      }
      return next;
    });
  };

  const handleNotificationClick = async (
    notificationId: string,
    actionUrl: string | null,
    readAt: string | null,
  ) => {
    if (!readAt) {
      await markRead.mutateAsync(notificationId);
    }
    setNotifOpen(false);
    const path = parseNotificationActionPath(actionUrl);
    if (path) {
      router.push(path);
    }
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (genRef.current && !genRef.current.contains(e.target as Node)) {
        setGenOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#eceef3] bg-[rgba(246,247,249,0.86)] px-7 py-3.5 backdrop-blur-[12px] backdrop-saturate-150 max-[720px]:px-[18px]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="pp-burger"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <MsIcon name="menu" size={20} className="text-[#475569]" />
        </button>
        <h1 className="font-display text-xl font-bold tracking-[-0.02em] text-[#0f172a]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        {linkedinConnectionState === "publishReady" ? (
          <div className="pp-search items-center gap-1.5 rounded-[10px] border border-[#cdeed7] bg-[#f0fdf4] px-3 py-2 text-[13px] font-semibold text-[#0a7a3f]">
            <MsIcon name="check_circle" size={16} className="text-[#16a34a]" />
            LinkedIn connected
          </div>
        ) : linkedinConnectionState === "needsPublishScope" ? (
          <button
            type="button"
            onClick={openConnect}
            className="pp-search items-center gap-1.5 rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[13px] font-semibold text-[#92400e] hover:bg-[#fef3c7]"
          >
            <MsIcon name="warning" size={16} className="text-[#d97706]" />
            Finish setup
          </button>
        ) : (
          <button
            type="button"
            onClick={openConnect}
            className="pp-search items-center gap-1.5 rounded-[10px] border border-[#cfe3f7] bg-white px-3 py-2 text-[13px] font-semibold text-[#0a66c2] hover:bg-[#f4f9ff]"
          >
            <span className="flex h-[17px] w-[17px] items-center justify-center rounded bg-[#0a66c2] font-display text-[10px] font-extrabold text-white">
              in
            </span>
            Connect
          </button>
        )}

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={handleNotificationToggle}
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#e7e9f2] bg-white hover:bg-[#f6f7fb]"
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <MsIcon name="notifications" size={20} className="text-[#475569]" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="animate-ppfade absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-[14px] border border-[#eceef3] bg-white shadow-[0_18px_40px_-14px_rgba(24,28,64,0.3)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f8] px-4 py-3">
                <span className="font-display text-sm font-bold">Notifications</span>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void markAllRead.mutateAsync()}
                    className="text-[12px] font-semibold text-[#4f46e5] hover:underline"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
              {notificationsLoading ? (
                <div className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <MsIcon
                    name="notifications_none"
                    size={28}
                    className="mx-auto mb-2 text-[#cbd5e1]"
                  />
                  <p className="text-[13px] font-semibold text-[#64748b]">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-[12px] text-[#94a3b8]">
                    Approval updates and publish alerts will appear here.
                  </p>
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() =>
                          void handleNotificationClick(
                            notification.id,
                            notification.actionUrl,
                            notification.readAt,
                          )
                        }
                        className="flex w-full gap-3 px-4 py-3 text-left hover:bg-[#f6f7fb]"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff]">
                          <MsIcon
                            name={getNotificationIcon(notification.type)}
                            size={16}
                            className="text-[#4f46e5]"
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2">
                            <span className="block flex-1 text-[13px] font-semibold text-[#1e293b]">
                              {notification.title}
                            </span>
                            {!notification.readAt ? (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4f46e5]" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-[#64748b]">
                            {notification.body}
                          </span>
                          <span className="mt-1 block text-[11px] text-[#94a3b8]">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-[#f1f3f8] px-4 py-2.5">
                <Link
                  href="/app/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-[12px] font-semibold text-[#4f46e5] hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={genRef}>
          <button
            type="button"
            data-tour="topbar-generate"
            onClick={handleGenerateToggle}
            className={`flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_3px_10px_rgba(79,70,229,0.26)] ${
              canGeneratePost
                ? "bg-[#4f46e5] hover:bg-[#4338ca]"
                : "cursor-not-allowed bg-[#94a3b8]"
            }`}
          >
            <MsIcon name="auto_awesome" size={17} />
            Generate
            <MsIcon name="expand_more" size={17} />
          </button>
          {genOpen ? (
            <div className="animate-ppfade absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-[13px] border border-[#eceef3] bg-white p-1.5 shadow-[0_18px_40px_-14px_rgba(24,28,64,0.3)]">
              <Link
                href="/app/generate"
                onClick={handleGeneratePostClick}
                className="flex items-center gap-3 rounded-[9px] p-2.5 hover:bg-[#f6f7fb]"
              >
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#eef2ff]">
                  <MsIcon name="auto_awesome" size={17} className="text-[#4f46e5]" />
                </div>
                <span className="text-[13.5px] font-semibold text-[#1e293b]">
                  Generate one post
                </span>
              </Link>
              <Link
                href="/app/generate/calendar"
                onClick={() => setGenOpen(false)}
                className="flex items-center gap-3 rounded-[9px] p-2.5 hover:bg-[#f6f7fb]"
              >
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#ecfeff]">
                  <MsIcon name="calendar_month" size={17} className="text-[#0891b2]" />
                </div>
                <span className="text-[13.5px] font-semibold text-[#1e293b]">
                  Create content calendar
                </span>
              </Link>
              <Link
                href="/app/autopilot"
                onClick={() => setGenOpen(false)}
                className="flex items-center gap-3 rounded-[9px] p-2.5 hover:bg-[#f6f7fb]"
              >
                <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#f5f0ff]">
                  <MsIcon name="auto_mode" size={17} className="text-[#7c3aed]" />
                </div>
                <span className="text-[13.5px] font-semibold text-[#1e293b]">
                  Start Autopilot
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
