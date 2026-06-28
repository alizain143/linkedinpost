"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
import { invalidatePostQueries } from "@/lib/post-query-invalidation";

const ACTIVE_LINK_POLL_MS = 15_000;

type ApprovalLinkStatusOptions = {
  pollWhileActive?: boolean;
  refreshRelatedOnDeactivate?: boolean;
};

export function useApprovalLinkStatus(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
  enabled = true,
  options?: ApprovalLinkStatusOptions,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const previousActiveRef = useRef<boolean | null>(null);
  const pollWhileActive = options?.pollWhileActive ?? false;
  const refreshRelatedOnDeactivate = options?.refreshRelatedOnDeactivate ?? false;

  const query = useQuery({
    queryKey: queryKeys.approvalShare.status(workspaceId ?? "", postId ?? ""),
    enabled: Boolean(isLoaded && isSignedIn && workspaceId && postId && enabled),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchApprovalLinkStatus(token, workspaceId!, postId!);
    },
    refetchInterval: pollWhileActive
      ? (currentQuery) => (currentQuery.state.data?.active ? ACTIVE_LINK_POLL_MS : false)
      : false,
  });

  useEffect(() => {
    if (!refreshRelatedOnDeactivate || !workspaceId || !postId || !enabled) {
      return;
    }

    const active = query.data?.active ?? false;
    if (previousActiveRef.current === true && !active) {
      invalidatePostQueries(queryClient, workspaceId, postId);
    }

    previousActiveRef.current = active;
  }, [
    enabled,
    postId,
    query.data?.active,
    queryClient,
    refreshRelatedOnDeactivate,
    workspaceId,
  ]);

  return query;
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
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
    },
  });
}

export type { ApiApprovalLinkStatus };
