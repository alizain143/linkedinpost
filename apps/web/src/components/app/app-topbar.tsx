"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MsIcon } from "@/components/ui/ms-icon";
import { useAppUi } from "@/providers/app-ui-provider";

type AppTopbarProps = {
  title: string;
  onMenuClick: () => void;
};

const NOTIFICATIONS = [
  {
    icon: "how_to_reg",
    tint: "#fff8eb",
    color: "#d97706",
    title: "Post ready for approval",
    time: "2 minutes ago",
    href: "/app/approvals",
  },
  {
    icon: "auto_mode",
    tint: "#f5f0ff",
    color: "#7c3aed",
    title: "Autopilot generated tomorrow's post",
    time: "26 minutes ago",
    href: "/app/autopilot",
  },
  {
    icon: "check_circle",
    tint: "#f0fdf4",
    color: "#16a34a",
    title: "Post published successfully",
    time: "1 hour ago",
    href: "/app/calendar",
  },
  {
    icon: "rate_review",
    tint: "#ecfeff",
    color: "#0891b2",
    title: "Client requested changes",
    time: "3 hours ago",
    href: "/app/approvals",
  },
  {
    icon: "link_off",
    tint: "#fef2f2",
    color: "#dc2626",
    title: "LinkedIn reconnect required",
    time: "Yesterday",
    href: "#",
    action: "connect" as const,
  },
];

export function AppTopbar({ title, onMenuClick }: AppTopbarProps) {
  const { linkedinConnected, openConnect, showToast } = useAppUi();
  const [notifOpen, setNotifOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const genRef = useRef<HTMLDivElement>(null);

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
        <div className="pp-search h-[38px] w-60 items-center gap-2 rounded-[10px] border border-[#e7e9f2] bg-white px-3">
          <MsIcon name="search" size={18} className="shrink-0 text-[#94a3b8]" />
          <Input
            variant="search"
            placeholder="Search posts, drafts…"
          />
        </div>

        {linkedinConnected ? (
          <div className="pp-search items-center gap-1.5 rounded-[10px] border border-[#cdeed7] bg-[#f0fdf4] px-3 py-2 text-[13px] font-semibold text-[#0a7a3f]">
            <MsIcon name="check_circle" size={16} className="text-[#16a34a]" />
            LinkedIn connected
          </div>
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
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#e7e9f2] bg-white hover:bg-[#f6f7fb]"
            aria-label="Notifications"
          >
            <MsIcon name="notifications" size={20} className="text-[#475569]" />
            <span className="absolute right-2.5 top-2 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-[#f43f5e]" />
          </button>
          {notifOpen ? (
            <div className="animate-ppfade absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-[14px] border border-[#eceef3] bg-white shadow-[0_18px_40px_-14px_rgba(24,28,64,0.3)]">
              <div className="flex items-center justify-between border-b border-[#f1f3f8] px-4 py-3">
                <span className="font-display text-sm font-bold">Notifications</span>
                <button
                  type="button"
                  onClick={() => showToast("All notifications marked read", "done_all")}
                  className="text-[11px] font-semibold text-[#4f46e5]"
                >
                  Mark all read
                </button>
              </div>
              {NOTIFICATIONS.map((n) => (
                <Link
                  key={n.title}
                  href={n.href}
                  onClick={(e) => {
                    if (n.action === "connect") {
                      e.preventDefault();
                      openConnect();
                    }
                    setNotifOpen(false);
                  }}
                  className="flex gap-3 border-b border-[#f6f7fb] px-4 py-3 last:border-0 hover:bg-[#fafbff]"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                    style={{ background: n.tint }}
                  >
                    <MsIcon name={n.icon} size={18} style={{ color: n.color }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold leading-snug text-[#1e293b]">
                      {n.title}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[#94a3b8]">{n.time}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative" ref={genRef}>
          <button
            type="button"
            onClick={() => setGenOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#4f46e5] px-4 py-2 text-[13.5px] font-semibold text-white shadow-[0_3px_10px_rgba(79,70,229,0.26)] hover:bg-[#4338ca]"
          >
            <MsIcon name="auto_awesome" size={17} />
            Generate
            <MsIcon name="expand_more" size={17} />
          </button>
          {genOpen ? (
            <div className="animate-ppfade absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-[13px] border border-[#eceef3] bg-white p-1.5 shadow-[0_18px_40px_-14px_rgba(24,28,64,0.3)]">
              <Link
                href="/app/generate"
                onClick={() => setGenOpen(false)}
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
                href="/app/calendar"
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
