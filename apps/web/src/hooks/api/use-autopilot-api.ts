"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchAutopilotConfig,
  fetchAutopilotPlannedPosts,
  upsertAutopilotConfig,
} from "@/lib/api/autopilot";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiAutopilotConfig,
  UpsertAutopilotConfigBody,
} from "@/lib/api/types/autopilot";
import type { ApiPostPackage } from "@/lib/api/types/post";

export function useAutopilotConfig(workspaceId: string | null | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.autopilot.config(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchAutopilotConfig(token, workspaceId);
    },
  });
}

export function useAutopilotPlannedPosts(workspaceId: string | null | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.autopilot.planned(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchAutopilotPlannedPosts(token, workspaceId);
    },
  });
}

export function useUpsertAutopilotConfig(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiAutopilotConfig, Error, UpsertAutopilotConfigBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return upsertAutopilotConfig(token, workspaceId, body);
    },
    onSuccess: (config) => {
      if (!workspaceId) return;

      queryClient.setQueryData(
        queryKeys.autopilot.config(workspaceId),
        config,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.autopilot.planned(workspaceId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.stats(workspaceId),
      });
    },
  });
}

export function useInvalidateAutopilot(workspaceId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!workspaceId) return;

    void queryClient.invalidateQueries({
      queryKey: queryKeys.autopilot.config(workspaceId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.autopilot.planned(workspaceId),
    });
  }, [queryClient, workspaceId]);
}

export type { ApiAutopilotConfig, ApiPostPackage };
