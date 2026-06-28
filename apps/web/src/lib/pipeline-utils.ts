import type {
  ApiPipelineColumn,
  ApiPostPackageSummary,
} from "@/lib/api/types/pipeline";
import {
  formatRelativeTime,
  formatScheduledDateTime,
} from "@/lib/format-relative-time";
import { getPostTypeLabel } from "@/lib/post-types";

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
