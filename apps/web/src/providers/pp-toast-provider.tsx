"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

type ToastState = { msg: string; icon: string } | null;

type PpToastContextValue = {
  showToast: (msg: string, icon?: string) => void;
};

const PpToastContext = createContext<PpToastContextValue | null>(null);

export function PpToastProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inAppShell = pathname.startsWith("/app");
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, icon = "check_circle") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, icon });
    timerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <PpToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
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
