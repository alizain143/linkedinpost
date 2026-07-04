import { apiFetch } from "@/lib/api/fetch";
import type {
  AiTemplateDraft,
  ApiMediaTemplate,
  CreateMediaTemplateBody,
  MediaMode,
  MediaTemplatesListResponse,
  PreviewMediaTemplateBody,
  PreviewMediaTemplateResponse,
  UpdateMediaTemplateBody,
} from "@/lib/api/types/media-template";

function templatesPath(workspaceId: string, suffix = ""): string {
  return `/workspaces/${workspaceId}/media-templates${suffix}`;
}

export async function fetchMediaTemplates(
  token: string,
  workspaceId: string,
): Promise<MediaTemplatesListResponse> {
  return apiFetch<MediaTemplatesListResponse>(
    token,
    templatesPath(workspaceId),
  );
}

export async function fetchMediaTemplate(
  token: string,
  workspaceId: string,
  id: string,
): Promise<ApiMediaTemplate> {
  return apiFetch<ApiMediaTemplate>(
    token,
    templatesPath(workspaceId, `/${encodeURIComponent(id)}`),
  );
}

export async function createMediaTemplate(
  token: string,
  workspaceId: string,
  body: CreateMediaTemplateBody,
): Promise<ApiMediaTemplate> {
  return apiFetch<ApiMediaTemplate>(token, templatesPath(workspaceId), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createMediaTemplateFromPreset(
  token: string,
  workspaceId: string,
  presetId: string,
): Promise<ApiMediaTemplate> {
  return apiFetch<ApiMediaTemplate>(
    token,
    templatesPath(workspaceId, `/from-preset/${encodeURIComponent(presetId)}`),
    { method: "POST" },
  );
}

export async function updateMediaTemplate(
  token: string,
  workspaceId: string,
  id: string,
  body: UpdateMediaTemplateBody,
): Promise<ApiMediaTemplate> {
  return apiFetch<ApiMediaTemplate>(
    token,
    templatesPath(workspaceId, `/${id}`),
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteMediaTemplate(
  token: string,
  workspaceId: string,
  id: string,
): Promise<{ id: string; deleted: boolean }> {
  return apiFetch(token, templatesPath(workspaceId, `/${id}`), {
    method: "DELETE",
  });
}

export async function setDefaultMediaTemplate(
  token: string,
  workspaceId: string,
  body: {
    scope: "workspace" | "content_profile";
    contentProfileId?: string;
    templateId?: string | null;
  },
): Promise<unknown> {
  return apiFetch(token, templatesPath(workspaceId, "/default"), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function setDefaultMediaMode(
  token: string,
  workspaceId: string,
  mode: MediaMode,
): Promise<{ defaultMediaMode: MediaMode }> {
  return apiFetch(token, templatesPath(workspaceId, "/default-mode"), {
    method: "PUT",
    body: JSON.stringify({ mode }),
  });
}

export async function aiDraftMediaTemplate(
  token: string,
  workspaceId: string,
  prompt: string,
): Promise<AiTemplateDraft> {
  return apiFetch<AiTemplateDraft>(
    token,
    templatesPath(workspaceId, "/ai-draft"),
    {
      method: "POST",
      body: JSON.stringify({ prompt }),
    },
  );
}

export async function previewMediaTemplate(
  token: string,
  workspaceId: string,
  body: PreviewMediaTemplateBody,
  templateId?: string | null,
): Promise<PreviewMediaTemplateResponse> {
  const path = templateId
    ? templatesPath(workspaceId, `/${encodeURIComponent(templateId)}/preview`)
    : templatesPath(workspaceId, "/preview");
  return apiFetch<PreviewMediaTemplateResponse>(token, path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
