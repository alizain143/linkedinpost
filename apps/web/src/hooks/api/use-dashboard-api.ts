"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchDashboardStats } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiDashboardStats } from "@/lib/api/types/dashboard";

export function useDashboardStats(workspaceId: string | null | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.stats(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchDashboardStats(token, workspaceId);
    },
  });
}

export function useInvalidateDashboardStats() {
  const queryClient = useQueryClient();

  return useCallback(
    (workspaceId?: string) => {
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.stats(workspaceId),
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    [queryClient],
  );
}

export type { ApiDashboardStats };
