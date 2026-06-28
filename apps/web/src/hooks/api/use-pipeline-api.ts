"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchPipeline } from "@/lib/api/pipeline";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiPipelineResponse,
  PipelineParams,
} from "@/lib/api/types/pipeline";

export function usePipeline(
  workspaceId: string | null | undefined,
  params?: PipelineParams,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.pipeline.board(workspaceId ?? "", params),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchPipeline(token, workspaceId, params);
    },
  });
}

export function useInvalidatePipeline() {
  const queryClient = useQueryClient();

  return useCallback(
    (workspaceId?: string) => {
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: ["pipeline", workspaceId],
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
    [queryClient],
  );
}

export type { ApiPipelineResponse, PipelineParams };
