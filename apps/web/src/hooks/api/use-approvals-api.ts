"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchApprovals } from "@/lib/api/approvals";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiApprovalsResponse,
  ApprovalsQueryParams,
} from "@/lib/api/types/approvals";

export function useApprovals(
  workspaceId: string | null | undefined,
  params?: ApprovalsQueryParams,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryParams: ApprovalsQueryParams = {
    tab: params?.tab ?? "mine",
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
  };

  return useQuery({
    queryKey: queryKeys.approvals.queue(workspaceId ?? "", queryParams),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchApprovals(token, workspaceId, queryParams);
    },
  });
}

export function useInvalidateApprovals() {
  const queryClient = useQueryClient();

  return useCallback(
    (workspaceId?: string) => {
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: ["approvals", workspaceId],
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
    [queryClient],
  );
}

export type { ApiApprovalsResponse, ApprovalsQueryParams };
