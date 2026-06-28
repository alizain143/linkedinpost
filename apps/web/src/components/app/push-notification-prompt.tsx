"use client";

import { MsIcon } from "@/components/ui/ms-icon";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushNotificationPrompt() {
  const { shouldShowPrompt, enablePush, dismissPrompt } =
    usePushNotifications();

  if (!shouldShowPrompt) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-[14px] border border-[#eceef3] bg-white p-4 shadow-[0_18px_40px_-14px_rgba(24,28,64,0.3)]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff]">
          <MsIcon name="notifications_active" size={18} className="text-[#4f46e5]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-[#0f172a]">
            Get alerts when posts are ready
          </p>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Enable browser notifications for approvals and publish updates.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void enablePush().then(() => dismissPrompt())}
              className="rounded-[8px] bg-[#4f46e5] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#4338ca]"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={dismissPrompt}
              className="rounded-[8px] px-3 py-1.5 text-[12px] font-semibold text-[#64748b] hover:bg-[#f6f7fb]"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
