import type {
  PostMediaType,
  PostPackageStatus,
  PostSource,
  PostType,
} from "@/lib/api/types/enums";

export type { PostMediaType };

export type ApiPostMedia = {
  id: string;
  postPackageId: string;
  mediaType: PostMediaType;
  url: string;
  altText: string;
  sortOrder: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ApiPostPackage = {
  id: string;
  workspaceId: string;
  contentProfileId: string | null;
  hook: string;
  body: string | null;
  cta: string | null;
  tags: string[];
  topic: string | null;
  postType: PostType | null;
  tone: string | null;
  pillar: string | null;
  source: PostSource;
  status: PostPackageStatus;
  score: number | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  linkedInPostId: string | null;
  linkedInPostUrl: string | null;
  publishErrorCode: string | null;
  publishErrorMessage: string | null;
  publishAttemptedAt: string | null;
  submittedForApprovalAt: string | null;
  approvalFeedback: string | null;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  media: ApiPostMedia[];
};

export type ApiPostVersion = {
  id: string;
  postPackageId: string;
  versionNumber: number;
  hook: string | null;
  body: string | null;
  cta: string | null;
  tags: string[];
  createdAt: string;
};

export type CreatePostBody = {
  hook: string;
  body?: string;
  cta?: string;
  tags?: string[];
  topic?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  contentProfileId?: string;
};

export type UpdatePostBody = {
  hook?: string;
  body?: string;
  cta?: string;
  tags?: string[];
  topic?: string;
  postType?: PostType;
  tone?: string;
  pillar?: string;
  contentProfileId?: string;
};

export type ListPostsParams = {
  status?: PostPackageStatus[];
  postType?: PostType;
  limit?: number;
  offset?: number;
};

export type TransitionPostStatusBody = {
  status: PostPackageStatus;
  scheduledAt?: string;
};

export type DeletePostResponse = {
  deleted: boolean;
};

export type RejectPostBody = {
  feedback?: string;
};

export type RequestChangesBody = {
  feedback: string;
};
