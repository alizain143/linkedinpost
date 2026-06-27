"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { MsIcon } from "@/components/ui/ms-icon";

type ToastState = { msg: string; icon: string } | null;

type PpToastContextValue = {
  showToast: (msg: string, icon?: string) => void;
};

const PpToastContext = createContext<PpToastContextValue | null>(null);

export function PpToastProvider({ children }: { children: React.ReactNode }) {
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
        <div className="animate-pptoast fixed bottom-7 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-[11px] rounded-[13px] bg-[#0d1326] px-5 py-[13px] text-white shadow-[0_18px_40px_-14px_rgba(15,19,38,0.5)]">
          <MsIcon name={toast.icon} size={20} className="text-[#5eead4]" />
          <span className="text-sm font-medium">{toast.msg}</span>
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
