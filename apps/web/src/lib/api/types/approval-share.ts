import type { PostPackageStatus, PostType } from "@/lib/api/types/enums";

export type ApiApprovalLinkCreated = {
  url: string;
  expiresAt: string;
};

export type ApiApprovalLinkStatus = {
  active: boolean;
  expiresAt?: string;
  createdAt?: string;
};

export type ApiApprovalLinkRevoked = {
  revoked: true;
};

export type ApiPublicApprovalMedia = {
  url: string;
  altText?: string | null;
  mimeType: string;
};

export type ApiPublicApprovalPreview = {
  hook: string;
  body?: string | null;
  cta?: string | null;
  tags: string[];
  pillar?: string | null;
  postType?: PostType | null;
  status: PostPackageStatus;
  submittedForApprovalAt?: string | null;
  workspaceName: string;
  media: ApiPublicApprovalMedia[];
};

export type ApiPublicApprovalAction = {
  id: string;
  status: PostPackageStatus;
  autoApplyStarted?: boolean;
}

export type PublicRejectBody = {
  feedback?: string;
};

export type PublicRequestChangesBody = {
  feedback: string;
};
