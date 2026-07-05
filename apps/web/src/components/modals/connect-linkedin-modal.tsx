"use client";

import { LogoMark } from "@/components/ui/logo-mark";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";

type ConnectLinkedInModalProps = {
  connecting: boolean;
  mode?: "connect" | "reauthorize" | "switch";
  onClose: () => void;
  onConnect: () => void;
};

export function ConnectLinkedInModal({
  connecting,
  mode = "connect",
  onClose,
  onConnect,
}: ConnectLinkedInModalProps) {
  const isReauthorize = mode === "reauthorize";
  const isSwitch = mode === "switch";

  return (
    <div
      className="animate-ppfade fixed inset-0 z-[92] flex items-center justify-center bg-[rgba(15,19,38,0.5)] p-6 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-ppscale w-full max-w-[440px] overflow-hidden rounded-[22px] bg-white shadow-[0_40px_90px_-30px_rgba(15,19,38,0.6)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0a66c2] to-[#004182] px-[30px] pb-[22px] pt-[30px] text-center text-white">
          <div className="pointer-events-none absolute -right-[10%] -top-[40%] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_70%)]" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-[9px] bg-white/18 text-white hover:bg-white/28"
            aria-label="Close"
            onClick={onClose}
          >
            <MsIcon name="close" size={19} className="text-white" />
          </Button>
          <div className="relative mb-1.5 flex items-center justify-center gap-3.5">
            <LogoMark size={46} className="rounded-xl" />
            <MsIcon name="sync_alt" size={22} className="text-white/70" />
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-white">
              <span className="font-display text-[22px] font-extrabold text-[#0a66c2]">
                in
              </span>
            </div>
          </div>
        </div>

        <div className="px-[30px] pb-7 pt-[26px]">
          <h2 className="text-center font-display text-[21px] font-extrabold tracking-[-0.02em] text-[#0d1326]">
            {isReauthorize
              ? "Finish LinkedIn publishing setup"
              : isSwitch
                ? "Switch LinkedIn account"
                : "Connect your LinkedIn account"}
          </h2>
          <p className="mx-auto mt-2 mb-[22px] max-w-[340px] text-center text-sm leading-[1.6] text-[#64748b]">
            {isReauthorize
              ? "Grant publish permission so linkedinpost.ai can schedule and publish approved posts to your profile."
              : isSwitch
                ? "Sign in with the LinkedIn profile for this workspace. Your other workspaces keep their own connections."
                : "Each workspace has its own LinkedIn profile. Sign in with the account that should publish for this workspace."}
          </p>

          {!isReauthorize ? (
            <p className="mx-auto mb-[18px] max-w-[340px] text-center text-xs leading-[1.55] text-[#94a3b8]">
              Wrong account?{" "}
              <a
                href="https://www.linkedin.com/m/logout"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#0a66c2] underline-offset-2 hover:underline"
              >
                Sign out of LinkedIn
              </a>{" "}
              in a new tab, then continue below.
            </p>
          ) : null}

          <div className="mb-[22px] flex flex-col gap-3 rounded-[14px] border border-[#eef0f5] bg-[#f8f9fc] px-[18px] py-4">
            {[
              { icon: "verified_user", text: "Secure OAuth. We never see your password" },
              { icon: "touch_app", text: "Nothing posts without your approval" },
              { icon: "link_off", text: "Disconnect anytime from Settings" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-[11px] text-[13.5px] text-[#1e293b]"
              >
                <MsIcon name={item.icon} size={19} className="text-[#0a66c2]" />
                {item.text}
              </div>
            ))}
          </div>

          {connecting ? (
            <Button
              type="button"
              variant="linkedin"
              size="lg"
              fullWidth
              disabled
              className="rounded-xl opacity-85"
            >
              <MsIcon
                name="progress_activity"
                size={19}
                className="animate-ppspin text-white"
              />
              {isReauthorize
                ? "Updating permissions…"
                : isSwitch
                  ? "Switching LinkedIn account…"
                  : "Connecting to LinkedIn…"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="linkedin"
              size="lg"
              fullWidth
              className="rounded-xl shadow-[0_6px_16px_rgba(10,102,194,0.32)]"
              onClick={onConnect}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-white font-display text-xs font-extrabold text-[#0a66c2]">
                in
              </span>
              {isReauthorize
                ? "Grant publish access"
                : isSwitch
                  ? "Sign in with LinkedIn"
                  : "Sign in with LinkedIn"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="modal"
            fullWidth
            className="mt-2.5"
            onClick={onClose}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
