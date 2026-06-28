"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApprovalLink,
  fetchApprovalLinkStatus,
  revokeApprovalLink,
} from "@/lib/api/approval-share";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiApprovalLinkCreated,
  ApiApprovalLinkRevoked,
  ApiApprovalLinkStatus,
} from "@/lib/api/types/approval-share";

export function useApprovalLinkStatus(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
  enabled = true,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.approvalShare.status(workspaceId ?? "", postId ?? ""),
    enabled: Boolean(isLoaded && isSignedIn && workspaceId && postId && enabled),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchApprovalLinkStatus(token, workspaceId!, postId!);
    },
  });
}

export function useCreateApprovalLinkMutation(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiApprovalLinkCreated, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!workspaceId || !postId) throw new Error("Missing workspace or post");
      return createApprovalLink(token, workspaceId, postId);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.approvalShare.status(workspaceId, postId),
        });
      }
    },
  });
}

export function useRevokeApprovalLinkMutation(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiApprovalLinkRevoked, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (!workspaceId || !postId) throw new Error("Missing workspace or post");
      return revokeApprovalLink(token, workspaceId, postId);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.approvalShare.status(workspaceId, postId),
        });
      }
    },
  });
}

export type { ApiApprovalLinkStatus };
