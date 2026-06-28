import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";

export function invalidatePostQueries(
  queryClient: QueryClient,
  workspaceId: string,
  postId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: ["posts", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["pipeline", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["approvals", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["calendar", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.stats(workspaceId),
  });
  if (postId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.posts.detail(workspaceId, postId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.posts.versions(workspaceId, postId),
    });
  }
}
