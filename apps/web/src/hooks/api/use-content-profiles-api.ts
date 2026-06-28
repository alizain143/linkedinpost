"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContentProfile,
  deleteContentProfile,
  fetchContentProfiles,
  updateContentProfile,
} from "@/lib/api/content-profiles";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiContentProfile,
  CreateContentProfileBody,
  UpdateContentProfileBody,
} from "@/lib/api/types/content-profile";

export function useContentProfiles(workspaceId: string | null | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.contentProfiles.list(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchContentProfiles(token, workspaceId);
    },
  });
}

export function useCreateContentProfile(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiContentProfile,
    Error,
    CreateContentProfileBody
  >({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return createContentProfile(token, workspaceId, body);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentProfiles.list(workspaceId),
        });
      }
    },
  });
}

export function useUpdateContentProfile(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiContentProfile,
    Error,
    { profileId: string; body: UpdateContentProfileBody }
  >({
    mutationFn: async ({ profileId, body }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return updateContentProfile(token, workspaceId, profileId, body);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentProfiles.list(workspaceId),
        });
      }
    },
  });
}

export function useDeleteContentProfile(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (profileId) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      await deleteContentProfile(token, workspaceId, profileId);
    },
    onSuccess: () => {
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.contentProfiles.list(workspaceId),
        });
      }
    },
  });
}
