import {
  PostPackage,
  PostPackageStatus,
  PostSource,
  PostType,
  PostVersion,
} from '@prisma/client';
import { PostMediaResponse } from '../media/media.types';

export interface PostPackageResponse {
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
  scheduledAt: Date | null;
  publishedAt: Date | null;
  linkedInPostId: string | null;
  linkedInPostUrl: string | null;
  publishErrorCode: string | null;
  publishErrorMessage: string | null;
  publishAttemptedAt: Date | null;
  submittedForApprovalAt: Date | null;
  approvalFeedback: string | null;
  versionNumber: number;
  createdAt: Date;
  updatedAt: Date;
  media: PostMediaResponse[];
}

export interface PostVersionResponse {
  id: string;
  postPackageId: string;
  versionNumber: number;
  hook: string | null;
  body: string | null;
  cta: string | null;
  tags: string[];
  createdAt: Date;
}

export interface PostPackageSummary {
  id: string;
  hook: string;
  pillar: string | null;
  postType: PostType | null;
  source: PostSource;
  status: PostPackageStatus;
  score: number | null;
  scheduledAt: Date | null;
  updatedAt: Date;
}

type PostPackageWithVersionCount = PostPackage & {
  _count?: { versions: number };
  versions?: PostVersion[];
};

export function toPostVersionResponse(
  version: PostVersion,
): PostVersionResponse {
  return {
    id: version.id,
    postPackageId: version.postPackageId,
    versionNumber: version.versionNumber,
    hook: version.hook,
    body: version.body,
    cta: version.cta,
    tags: version.tags,
    createdAt: version.createdAt,
  };
}

export function toPostPackageResponse(
  post: PostPackageWithVersionCount,
  versionNumber?: number,
  media: PostMediaResponse[] = [],
): PostPackageResponse {
  const resolvedVersionNumber =
    versionNumber ??
    post._count?.versions ??
    (post.versions?.length
      ? Math.max(...post.versions.map((v) => v.versionNumber))
      : 0);

  return {
    id: post.id,
    workspaceId: post.workspaceId,
    contentProfileId: post.contentProfileId,
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    tags: post.tags,
    topic: post.topic,
    postType: post.postType,
    tone: post.tone,
    pillar: post.pillar,
    source: post.source,
    status: post.status,
    score: post.score,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    linkedInPostId: post.linkedInPostId,
    linkedInPostUrl: post.linkedInPostUrl,
    publishErrorCode: post.publishErrorCode,
    publishErrorMessage: post.publishErrorMessage,
    publishAttemptedAt: post.publishAttemptedAt,
    submittedForApprovalAt: post.submittedForApprovalAt,
    approvalFeedback: post.approvalFeedback,
    versionNumber: resolvedVersionNumber,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    media,
  };
}

export function toPostPackageSummary(post: PostPackage): PostPackageSummary {
  return {
    id: post.id,
    hook: post.hook,
    pillar: post.pillar,
    postType: post.postType,
    source: post.source,
    status: post.status,
    score: post.score,
    scheduledAt: post.scheduledAt,
    updatedAt: post.updatedAt,
  };
}

export function buildVersionSnapshot(post: {
  hook: string;
  body: string | null;
  cta: string | null;
  tags: string[];
}) {
  return {
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    tags: post.tags,
  };
}

export const CONTENT_VERSION_FIELDS = ['hook', 'body', 'cta', 'tags'] as const;
