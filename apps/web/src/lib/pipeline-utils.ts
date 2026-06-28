import type {
  ApiPipelineColumn,
  ApiPostPackageSummary,
} from "@/lib/api/types/pipeline";
import type { PostPackageStatus } from "@/lib/api/types/enums";
import {
  formatRelativeTime,
  formatScheduledDateTime,
} from "@/lib/format-relative-time";
import { getPostTypeLabel } from "@/lib/post-types";

/** Manual status moves allowed via pipeline kanban / list (mirrors backend ALLOWED_TRANSITIONS). */
export const MANUAL_STATUS_TRANSITIONS: Partial<
  Record<PostPackageStatus, PostPackageStatus[]>
> = {
  draft: ["ready_for_approval", "approved"],
  ready_for_approval: ["approved", "draft"],
  approved: ["ready_for_approval", "draft"],
  scheduled: ["approved", "draft"],
  failed: ["draft"],
};

export function getManualStatusTransitions(
  fromStatus: PostPackageStatus,
): PostPackageStatus[] {
  return MANUAL_STATUS_TRANSITIONS[fromStatus] ?? [];
}

export function canTransitionPostStatus(
  fromStatus: PostPackageStatus,
  toStatus: PostPackageStatus,
): boolean {
  if (fromStatus === toStatus) return false;
  return getManualStatusTransitions(fromStatus).includes(toStatus);
}

export function columnHasMore(column: ApiPipelineColumn): boolean {
  return column.count > column.posts.length;
}

export function columnOverflowCount(column: ApiPipelineColumn): number {
  return Math.max(0, column.count - column.posts.length);
}

export function flattenPipelinePosts(
  columns: ApiPipelineColumn[],
): ApiPostPackageSummary[] {
  const byId = new Map<string, ApiPostPackageSummary>();

  for (const column of columns) {
    for (const post of column.posts) {
      byId.set(post.id, post);
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function formatPipelineCardDate(post: ApiPostPackageSummary): string {
  if (post.scheduledAt) {
    return formatScheduledDateTime(post.scheduledAt);
  }
  return formatRelativeTime(post.updatedAt);
}

export function formatPipelineCardSubtitle(post: ApiPostPackageSummary): string {
  const typeLabel = getPostTypeLabel(post.postType);
  const parts = [typeLabel, post.pillar].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
