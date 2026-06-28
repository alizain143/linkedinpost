import { apiFetch } from "@/lib/api/fetch";
import type { ApiCouncilTimeline } from "@/lib/api/types/council";

export async function fetchCouncilHistory(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiCouncilTimeline> {
  return apiFetch<ApiCouncilTimeline>(
    token,
    `/workspaces/${workspaceId}/posts/${postId}/council`,
  );
}
