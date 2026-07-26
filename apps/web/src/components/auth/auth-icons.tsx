"use client";

import { SvgIcon } from "@/components/ui/svg-icon";
import { ICON_PATHS } from "@/lib/icon-paths";

export function GoogleIcon() {
  return <SvgIcon src={ICON_PATHS.google} size={18} />;
}

export function LinkedInIcon() {
  return (
    <span
      aria-hidden
      className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[#0a66c2] font-display text-[11px] font-extrabold leading-none text-white"
    >
      in
    </span>
  );
}
