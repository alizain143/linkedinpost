"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiWorkspace,
  ApiWorkspaceDetail,
  CreateClientWorkspaceBody,
  DeleteClientWorkspaceResponse,
  UpdateClientWorkspaceBody,
  UpdateWorkspaceSettingsBody,
} from "@/lib/api/types/workspace";
import { filterClientWorkspaces } from "@/lib/client-workspace-utils";
import {
  createClientWorkspace,
  deleteClientWorkspace,
  fetchWorkspace,
  fetchWorkspaces,
  updateClientWorkspace,
  updateWorkspaceSettings,
} from "@/lib/api/workspaces";

export function useWorkspaces() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.workspaces.all,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWorkspaces(token);
    },
  });
}

export function useClientWorkspaces() {
  const query = useWorkspaces();

  const clientWorkspaces = useMemo(
    () => filterClientWorkspaces(query.data ?? []),
    [query.data],
  );

  return {
    ...query,
    clientWorkspaces,
  };
}

export function useClientWorkspaceDetails(clientIds: string[]) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const queries = useQueries({
    queries: clientIds.map((workspaceId) => ({
      queryKey: queryKeys.workspaces.detail(workspaceId),
      enabled: isLoaded && isSignedIn && !!workspaceId,
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");
        return fetchWorkspace(token, workspaceId);
      },
    })),
  });

  const detailsById = useMemo(() => {
    const map = new Map<string, ApiWorkspaceDetail>();
    clientIds.forEach((workspaceId, index) => {
      const detail = queries[index]?.data;
      if (detail) {
        map.set(workspaceId, detail);
      }
    });
    return map;
  }, [clientIds, queries]);

  const isLoading = queries.some((query) => query.isLoading);
  const error = queries.find((query) => query.error)?.error ?? null;

  return {
    detailsById,
    isLoading,
    error,
    refetch: () => {
      queries.forEach((query) => {
        void query.refetch();
      });
    },
  };
}

export function useWorkspaceDetail(workspaceId: string | null | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.workspaces.detail(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchWorkspace(token, workspaceId);
    },
  });
}

export function useInvalidateWorkspaces() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    void queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  }, [queryClient]);
}

export function useCreateClientWorkspace() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiWorkspaceDetail, Error, CreateClientWorkspaceBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createClientWorkspace(token, body);
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export function useUpdateClientWorkspace() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiWorkspaceDetail,
    Error,
    { workspaceId: string; body: UpdateClientWorkspaceBody }
  >({
    mutationFn: async ({ workspaceId, body }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateClientWorkspace(token, workspaceId, body);
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export function useUpdateWorkspaceSettings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiWorkspaceDetail,
    Error,
    { workspaceId: string; body: UpdateWorkspaceSettingsBody }
  >({
    mutationFn: async ({ workspaceId, body }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return updateWorkspaceSettings(token, workspaceId, body);
    },
    onSuccess: (detail) => {
      queryClient.setQueryData(queryKeys.workspaces.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export function useDeleteClientWorkspace() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    DeleteClientWorkspaceResponse,
    Error,
    string
  >({
    mutationFn: async (workspaceId) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return deleteClientWorkspace(token, workspaceId);
    },
    onSuccess: (_result, workspaceId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.workspaces.detail(workspaceId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all });
    },
  });
}

export type { ApiWorkspace, ApiWorkspaceDetail };
