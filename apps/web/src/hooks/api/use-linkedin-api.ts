"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  bindLinkedInConnection,
  createLinkedInImportToken,
  disconnectLinkedInConnection,
  fetchLinkedInConnection,
  fetchLinkedInProfile,
  importLinkedInProfileAuthenticated,
  syncLinkedInProfile,
} from "@/lib/api/linkedin";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiLinkedInConnectionStatus,
  ApiLinkedInImportToken,
  ApiLinkedInProfile,
  ImportLinkedInProfileInput,
} from "@/lib/api/types/linkedin";

export function useLinkedInConnection(workspaceId: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.linkedin.connection(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && Boolean(workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchLinkedInConnection(token, workspaceId);
    },
  });
}

export function useLinkedInProfile(workspaceId: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.linkedin.profile(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && Boolean(workspaceId),
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchLinkedInProfile(token, workspaceId);
    },
  });
}

export function useBindLinkedInConnection(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clerkExternalAccountId?: string) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return bindLinkedInConnection(token, workspaceId, clerkExternalAccountId);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.linkedin.all(workspaceId),
      });
    },
  });
}

export function useDisconnectLinkedInConnection(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return disconnectLinkedInConnection(token, workspaceId);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.linkedin.all(workspaceId),
      });
    },
  });
}

export function useSyncLinkedInProfile(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return syncLinkedInProfile(token, workspaceId);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.linkedin.all(workspaceId),
      });
    },
  });
}

export function useCreateLinkedInImportToken(workspaceId: string | null) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (body?: {
      profileUrl?: string;
    }): Promise<ApiLinkedInImportToken> => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return createLinkedInImportToken(token, workspaceId, body);
    },
  });
}

export function useImportLinkedInProfile(workspaceId: string | null) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: ImportLinkedInProfileInput) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return importLinkedInProfileAuthenticated(token, workspaceId, body);
    },
    onSuccess: () => {
      if (!workspaceId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.linkedin.all(workspaceId),
      });
    },
  });
}

export function useInvalidateLinkedIn(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!workspaceId) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.linkedin.all(workspaceId),
    });
  }, [queryClient, workspaceId]);
}

export type { ApiLinkedInConnectionStatus, ApiLinkedInProfile };
