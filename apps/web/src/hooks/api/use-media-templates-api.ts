"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aiDraftMediaTemplate,
  createMediaTemplate,
  createMediaTemplateFromPreset,
  deleteMediaTemplate,
  fetchMediaTemplate,
  fetchMediaTemplates,
  previewMediaTemplate,
  setDefaultMediaMode,
  setDefaultMediaTemplate,
  updateMediaTemplate,
} from "@/lib/api/media-templates";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  AiDraftMediaTemplateBody,
  AiTemplateDraft,
  ApiMediaTemplate,
  CreateMediaTemplateBody,
  MediaMode,
  PreviewMediaTemplateBody,
  PreviewMediaTemplateResponse,
  UpdateMediaTemplateBody,
} from "@/lib/api/types/media-template";

export function useMediaTemplates(workspaceId: string | null | undefined) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.mediaTemplates.list(workspaceId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchMediaTemplates(token, workspaceId);
    },
  });
}

export function useMediaTemplate(
  workspaceId: string | null | undefined,
  id: string | null | undefined,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.mediaTemplates.detail(workspaceId ?? "", id ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId && !!id,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId || !id) throw new Error("Not authenticated");
      return fetchMediaTemplate(token, workspaceId, id);
    },
  });
}

function invalidateTemplates(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.mediaTemplates.list(workspaceId),
  });
}

export function useCreateMediaTemplate(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiMediaTemplate, Error, CreateMediaTemplateBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return createMediaTemplate(token, workspaceId, body);
    },
    onSuccess: () => {
      if (workspaceId) invalidateTemplates(queryClient, workspaceId);
    },
  });
}

export function useCreateMediaTemplateFromPreset(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiMediaTemplate, Error, string>({
    mutationFn: async (presetId) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return createMediaTemplateFromPreset(token, workspaceId, presetId);
    },
    onSuccess: () => {
      if (workspaceId) invalidateTemplates(queryClient, workspaceId);
    },
  });
}

export function useUpdateMediaTemplate(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiMediaTemplate,
    Error,
    { id: string; body: UpdateMediaTemplateBody }
  >({
    mutationFn: async ({ id, body }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return updateMediaTemplate(token, workspaceId, id, body);
    },
    onSuccess: (_data, vars) => {
      if (workspaceId) {
        invalidateTemplates(queryClient, workspaceId);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.mediaTemplates.detail(workspaceId, vars.id),
        });
      }
    },
  });
}

export function useDeleteMediaTemplate(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<{ id: string; deleted: boolean }, Error, string>({
    mutationFn: async (id) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return deleteMediaTemplate(token, workspaceId, id);
    },
    onSuccess: () => {
      if (workspaceId) invalidateTemplates(queryClient, workspaceId);
    },
  });
}

export function useSetDefaultMediaTemplate(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    {
      scope: "workspace" | "content_profile";
      contentProfileId?: string;
      templateId?: string | null;
    }
  >({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return setDefaultMediaTemplate(token, workspaceId, body);
    },
    onSuccess: () => {
      if (workspaceId) invalidateTemplates(queryClient, workspaceId);
    },
  });
}

export function useSetDefaultMediaMode(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<{ defaultMediaMode: MediaMode }, Error, MediaMode>({
    mutationFn: async (mode) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return setDefaultMediaMode(token, workspaceId, mode);
    },
    onSuccess: () => {
      if (workspaceId) invalidateTemplates(queryClient, workspaceId);
    },
  });
}

export function useAiDraftMediaTemplate(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();

  return useMutation<AiTemplateDraft, Error, AiDraftMediaTemplateBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return aiDraftMediaTemplate(token, workspaceId, body);
    },
  });
}

export function usePreviewMediaTemplate(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();

  return useMutation<
    PreviewMediaTemplateResponse,
    Error,
    { body: PreviewMediaTemplateBody; templateId?: string | null }
  >({
    mutationFn: async ({ body, templateId }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return previewMediaTemplate(token, workspaceId, body, templateId);
    },
  });
}
