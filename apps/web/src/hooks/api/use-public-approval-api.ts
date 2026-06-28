"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  fetchPublicApprovalPreview,
  publicApprove,
  publicReject,
  publicRequestChanges,
} from "@/lib/api/public-approval";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiPublicApprovalAction,
  ApiPublicApprovalPreview,
  PublicRejectBody,
  PublicRequestChangesBody,
} from "@/lib/api/types/approval-share";

export function usePublicApprovalPreview(token: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.publicApproval.preview(token ?? ""),
    enabled: Boolean(token),
    queryFn: () => fetchPublicApprovalPreview(token!),
    retry: false,
  });
}

export function usePublicApproveMutation(token: string) {
  return useMutation<ApiPublicApprovalAction, Error, void>({
    mutationFn: () => publicApprove(token),
  });
}

export function usePublicRequestChangesMutation(token: string) {
  return useMutation<ApiPublicApprovalAction, Error, PublicRequestChangesBody>({
    mutationFn: (body) => publicRequestChanges(token, body),
  });
}

export function usePublicRejectMutation(token: string) {
  return useMutation<ApiPublicApprovalAction, Error, PublicRejectBody>({
    mutationFn: (body) => publicReject(token, body),
  });
}

export type { ApiPublicApprovalPreview };
