"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { fetchCouncilHistory } from "@/lib/api/council";
import { queryKeys } from "@/lib/api/query-keys";

export function useCouncilHistory(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.council.history(workspaceId ?? "", postId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId && !!postId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) {
        throw new Error("Not authenticated");
      }
      return fetchCouncilHistory(token, workspaceId, postId);
    },
  });
}
