import type { ApprovalTab } from "@/lib/api/types/approvals";

export const APPROVAL_TABS: Array<{ id: ApprovalTab; label: string }> = [
  { id: "mine", label: "My Approvals" },
  { id: "client", label: "Client Approvals" },
  { id: "changes", label: "Changes Requested" },
  { id: "approved", label: "Approved" },
];

const APPROVAL_TAB_SET = new Set<string>(APPROVAL_TABS.map((tab) => tab.id));

export function parseApprovalTab(value: string | null): ApprovalTab {
  if (value && APPROVAL_TAB_SET.has(value)) {
    return value as ApprovalTab;
  }
  return "mine";
}

export function getApprovalEmptyMessage(tab: ApprovalTab): string {
  switch (tab) {
    case "mine":
      return "No posts waiting for your approval.";
    case "client":
      return "No client posts waiting for approval.";
    case "changes":
      return "No posts waiting for changes. Feedback lands here until you apply AI or edit manually.";
    case "approved":
      return "No approved posts yet.";
  }
}

export function approvalTabActions(tab: ApprovalTab): {
  showApprove: boolean;
  showRequestChanges: boolean;
  showReject: boolean;
  showSchedule: boolean;
  showApplyChanges: boolean;
} {
  switch (tab) {
    case "mine":
    case "client":
      return {
        showApprove: true,
        showRequestChanges: true,
        showReject: true,
        showSchedule: false,
        showApplyChanges: false,
      };
    case "changes":
      return {
        showApprove: false,
        showRequestChanges: false,
        showReject: false,
        showSchedule: false,
        showApplyChanges: true,
      };
    case "approved":
      return {
        showApprove: false,
        showRequestChanges: false,
        showReject: false,
        showSchedule: true,
        showApplyChanges: false,
      };
  }
}
