import {
  PostPackage,
  PostPackageStatus,
  PostSource,
  PostType,
} from '@prisma/client';

export interface ApprovalQueueItem {
  id: string;
  hook: string;
  pillar: string | null;
  postType: PostType | null;
  source: PostSource;
  status: PostPackageStatus;
  score: number | null;
  submittedForApprovalAt: Date | null;
  approvalFeedback: string | null;
  updatedAt: Date;
  workspaceId: string;
  workspaceName: string;
}

type PostWithWorkspace = PostPackage & {
  workspace: { id: string; name: string };
};

export function toApprovalQueueItem(post: PostWithWorkspace): ApprovalQueueItem {
  return {
    id: post.id,
    hook: post.hook,
    pillar: post.pillar,
    postType: post.postType,
    source: post.source,
    status: post.status,
    score: post.score,
    submittedForApprovalAt: post.submittedForApprovalAt,
    approvalFeedback: post.approvalFeedback,
    updatedAt: post.updatedAt,
    workspaceId: post.workspace.id,
    workspaceName: post.workspace.name,
  };
}
