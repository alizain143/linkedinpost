"use client";

import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

export type ModalHeaderTone = "danger" | "neutral" | "warning" | "success";

const TONE_STYLES: Record<ModalHeaderTone, { bg: string; color: string }> = {
  danger: { bg: "bg-[#fef2f2]", color: "#dc2626" },
  neutral: { bg: "bg-[#eef2ff]", color: "#4f46e5" },
  warning: { bg: "bg-[#fff8eb]", color: "#d97706" },
  success: { bg: "bg-[#f0fdf4]", color: "#16a34a" },
};

type ModalHeaderProps = {
  icon: string;
  title: string;
  tone?: ModalHeaderTone;
  className?: string;
};

export function ModalHeader({
  icon,
  title,
  tone = "neutral",
  className,
}: ModalHeaderProps) {
  const style = TONE_STYLES[tone];

  return (
    <div className={cn("mb-4 flex items-center gap-[11px]", className)}>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]",
          style.bg,
        )}
      >
        <MsIcon name={icon} size={23} style={{ color: style.color }} />
      </div>
      <h2 className="font-display text-lg font-bold tracking-[-0.01em] text-[#0d1326]">
        {title}
      </h2>
    </div>
  );
}
