"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchLinkedInConnection,
  fetchLinkedInProfile,
  syncLinkedInProfile,
} from "@/lib/api/linkedin";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiLinkedInConnectionStatus,
  ApiLinkedInProfile,
} from "@/lib/api/types/linkedin";

export function useLinkedInConnection() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.linkedin.connection,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchLinkedInConnection(token);
    },
  });
}

export function useLinkedInProfile() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.linkedin.profile,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchLinkedInProfile(token);
    },
  });
}

export function useSyncLinkedInProfile() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return syncLinkedInProfile(token);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["linkedin"] });
    },
  });
}

export function useInvalidateLinkedIn() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["linkedin"] });
  }, [queryClient]);
}

export type { ApiLinkedInConnectionStatus, ApiLinkedInProfile };
