import type {
  ApiApprovalQueueItem,
  ApprovalTab,
} from "@/lib/api/types/approvals";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { getPostSourceLabel } from "@/lib/post-source";

export function formatApprovalSubmittedAt(
  submittedForApprovalAt: string | null,
  updatedAt: string,
): string {
  return formatRelativeTime(submittedForApprovalAt ?? updatedAt);
}

export function getApprovalScoreStyle(score: number | null): {
  bg: string;
  text: string;
} {
  if (score == null) {
    return { bg: "#f1f3f8", text: "#64748b" };
  }
  if (score >= 85) {
    return { bg: "#f0fdf4", text: "#16a34a" };
  }
  return { bg: "#fff8eb", text: "#d97706" };
}

export function getApprovalPreviewLine(
  item: ApiApprovalQueueItem,
  tab: ApprovalTab,
): string {
  if (tab === "changes" && item.approvalFeedback) {
    return item.approvalFeedback;
  }
  return item.pillar ?? "—";
}

export function getApprovalMetadataLine(
  item: ApiApprovalQueueItem,
  tab: ApprovalTab,
): string {
  const parts = [
    tab === "client" || tab === "mine" ? item.workspaceName : null,
    getPostSourceLabel(item.source),
    formatApprovalSubmittedAt(item.submittedForApprovalAt, item.updatedAt),
  ].filter(Boolean);

  return parts.join(" · ");
}
