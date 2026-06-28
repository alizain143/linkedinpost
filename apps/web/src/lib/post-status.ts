import type { PostPackageStatus } from "@/lib/api/types/enums";

export const POST_STATUS_LABELS: Record<PostPackageStatus, string> = {
  draft: "Draft",
  text_generating: "Text Generating",
  text_reviewing: "Text Reviewing",
  media_generating: "Media Generating",
  ready_for_approval: "Ready for Approval",
  approved: "Approved",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
};

export const POST_STATUS_STYLES: Record<
  PostPackageStatus,
  { bg: string; text: string }
> = {
  draft: { bg: "#f5f0ff", text: "#7c3aed" },
  text_generating: { bg: "#f5f0ff", text: "#7c3aed" },
  text_reviewing: { bg: "#f5f0ff", text: "#7c3aed" },
  media_generating: { bg: "#ecfeff", text: "#0891b2" },
  ready_for_approval: { bg: "#fff8eb", text: "#d97706" },
  approved: { bg: "#f0fdf4", text: "#16a34a" },
  scheduled: { bg: "#eef2ff", text: "#4f46e5" },
  publishing: { bg: "#eef2ff", text: "#4f46e5" },
  published: { bg: "#f0fdf4", text: "#16a34a" },
  failed: { bg: "#fef2f2", text: "#dc2626" },
};

const POST_STATUS_SET = new Set<string>(Object.keys(POST_STATUS_LABELS));

export function isPostPackageStatus(value: string): value is PostPackageStatus {
  return POST_STATUS_SET.has(value);
}

export function getPostStatusLabel(status: PostPackageStatus): string {
  return POST_STATUS_LABELS[status];
}

export const CALENDAR_LEGEND_STATUSES: PostPackageStatus[] = [
  "scheduled",
  "published",
  "failed",
  "ready_for_approval",
];
