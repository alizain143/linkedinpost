import type {
  PostPackageStatus,
  PostSource,
  PostType,
} from "@/lib/api/types/enums";

export type ApprovalTab = "mine" | "client" | "changes" | "approved";

export type ApiApprovalQueueItem = {
  id: string;
  hook: string;
  pillar: string | null;
  postType: PostType | null;
  source: PostSource;
  status: PostPackageStatus;
  score: number | null;
  submittedForApprovalAt: string | null;
  approvalFeedback: string | null;
  updatedAt: string;
  workspaceId: string;
  workspaceName: string;
};

export type ApiApprovalTabCounts = {
  mine: number;
  client: number;
  changes: number;
  approved: number;
};

export type ApiApprovalsResponse = {
  tab: ApprovalTab;
  counts: ApiApprovalTabCounts;
  items: ApiApprovalQueueItem[];
};

export type ApprovalsQueryParams = {
  tab?: ApprovalTab;
  limit?: number;
  offset?: number;
};
