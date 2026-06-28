"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MsIcon } from "@/components/ui/ms-icon";
import { parseNotificationActionPath } from "@/lib/notification-utils";
import { cn } from "@/lib/utils";

type DefaultToastState = { kind: "default"; msg: string; icon: string };
type NotificationToastState = {
  kind: "notification";
  title: string;
  body: string;
  actionUrl?: string | null;
};

type ToastState = DefaultToastState | NotificationToastState | null;

type PpToastContextValue = {
  showToast: (msg: string, icon?: string) => void;
  showNotificationToast: (
    title: string,
    body: string,
    actionUrl?: string | null,
  ) => void;
};

const PpToastContext = createContext<PpToastContextValue | null>(null);

export function PpToastProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const inAppShell = pathname.startsWith("/app");
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (msg: string, icon = "check_circle") => {
      clearToastTimer();
      setToast({ kind: "default", msg, icon });
      timerRef.current = setTimeout(() => setToast(null), 2400);
    },
    [clearToastTimer],
  );

  const showNotificationToast = useCallback(
    (title: string, body: string, actionUrl?: string | null) => {
      clearToastTimer();
      setToast({ kind: "notification", title, body, actionUrl });
      timerRef.current = setTimeout(() => setToast(null), 6000);
    },
    [clearToastTimer],
  );

  const dismissNotificationToast = useCallback(
    (actionUrl?: string | null) => {
      clearToastTimer();
      setToast(null);

      const path = parseNotificationActionPath(actionUrl ?? null);
      if (path) {
        router.push(path);
      }
    },
    [clearToastTimer, router],
  );

  useEffect(() => () => clearToastTimer(), [clearToastTimer]);

  return (
    <PpToastContext.Provider value={{ showToast, showNotificationToast }}>
      {children}
      {toast?.kind === "default" ? (
        <div
          className={cn(
            "pointer-events-none fixed bottom-7 left-0 right-0 z-[95] flex justify-center px-4",
            inAppShell && "min-[921px]:left-[250px]",
          )}
        >
          <div className="animate-pptoast pointer-events-auto flex items-center gap-[11px] rounded-[13px] bg-[#0d1326] px-5 py-[13px] text-white shadow-[0_18px_40px_-14px_rgba(15,19,38,0.5)]">
            <MsIcon name={toast.icon} size={20} className="text-[#5eead4]" />
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        </div>
      ) : null}
      {toast?.kind === "notification" ? (
        <div className="pointer-events-none fixed right-5 top-5 z-[96] max-w-sm px-4 sm:px-0">
          <button
            type="button"
            onClick={() => dismissNotificationToast(toast.actionUrl)}
            className="animate-pptoast pointer-events-auto w-full rounded-[14px] border border-[#eceef3] bg-white p-4 text-left shadow-[0_18px_40px_-14px_rgba(24,28,64,0.28)] transition-colors hover:bg-[#fafbff]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe]">
                <MsIcon
                  name="notifications_active"
                  size={18}
                  className="text-[#5B3DF5]"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-[#0f172a]">
                  {toast.title}
                </p>
                {toast.body ? (
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[#64748b]">
                    {toast.body}
                  </p>
                ) : null}
                {toast.actionUrl ? (
                  <p className="mt-2 text-[11.5px] font-semibold text-[#5B3DF5]">
                    View in app
                  </p>
                ) : null}
              </div>
            </div>
          </button>
        </div>
      ) : null}
    </PpToastContext.Provider>
  );
}

export function usePpToast() {
  const ctx = useContext(PpToastContext);
  if (!ctx) {
    throw new Error("usePpToast must be used within PpToastProvider");
  }
  return ctx;
}
