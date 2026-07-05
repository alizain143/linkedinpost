/** Design tokens from PostPilot AI.dc.html — authenticated app area */
"use client";

import type { PostPackageStatus } from "@/lib/api/types/enums";
import {
  getPostStatusLabel,
  isPostPackageStatus,
  POST_STATUS_STYLES,
} from "@/lib/post-status";

export const appCard =
  "rounded-2xl border border-[#eceef4] bg-white";
export const appCardLg =
  "rounded-[16px] border border-[#eceef4] bg-white";
export const appCardMd =
  "rounded-[15px] border border-[#eceef4] bg-white";
export const appLabel =
  "mb-[7px] block text-[12.5px] font-semibold text-[#475569]";
export const appSectionTitle =
  "font-display text-base font-bold text-[#1e293b]";
export const appMuted = "text-[13px] text-[#64748b]";
export const appMutedSm = "text-[12px] text-[#94a3b8]";

export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Idea: { bg: "#f1f3f8", text: "#64748b" },
  Planned: { bg: "#f1f3f8", text: "#64748b" },
  Draft: { bg: "#f5f0ff", text: "#7c3aed" },
  Generating: { bg: "#f5f0ff", text: "#7c3aed" },
  Scheduled: { bg: "#eef2ff", text: "#4f46e5" },
  Published: { bg: "#f0fdf4", text: "#16a34a" },
  Approved: { bg: "#f0fdf4", text: "#16a34a" },
  "Ready for Approval": { bg: "#fff8eb", text: "#d97706" },
  Failed: { bg: "#fef2f2", text: "#dc2626" },
  "Brief Created": { bg: "#f1f3f8", text: "#64748b" },
  "Text Generating": { bg: "#f5f0ff", text: "#7c3aed" },
  "Text Reviewing": { bg: "#f5f0ff", text: "#7c3aed" },
  "Media Generating": { bg: "#ecfeff", text: "#0891b2" },
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: PostPackageStatus | string;
  className?: string;
}) {
  const label = isPostPackageStatus(status)
    ? getPostStatusLabel(status)
    : status;
  const s = isPostPackageStatus(status)
    ? POST_STATUS_STYLES[status]
    : (STATUS_STYLES[status] ?? { bg: "#f1f3f8", text: "#64748b" });
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${className}`}
      style={{ background: s.bg, color: s.text }}
    >
      {label}
    </span>
  );
}
