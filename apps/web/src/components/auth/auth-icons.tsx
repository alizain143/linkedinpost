"use client";

import { useEffect, useState } from "react";
import { SvgIcon } from "@/components/ui/svg-icon";
import { ICON_PATHS } from "@/lib/icon-paths";

export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const uaData = navigator as Navigator & { userAgentData?: { platform: string } };
    const platform = uaData.userAgentData?.platform ?? navigator.platform ?? "";
    setIsMac(platform === "macOS" || /Mac|Macintosh/i.test(platform));
  }, []);

  return isMac;
}

export function GoogleIcon() {
  return <SvgIcon src={ICON_PATHS.google} size={18} />;
}

export function AppleIcon() {
  return <SvgIcon src={ICON_PATHS.apple} size={18} inheritColor />;
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
