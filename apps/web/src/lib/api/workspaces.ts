import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiWorkspace,
  ApiWorkspaceDetail,
  CreateClientWorkspaceBody,
  DeleteClientWorkspaceResponse,
  UpdateClientWorkspaceBody,
} from "@/lib/api/types/workspace";

export async function fetchWorkspaces(token: string): Promise<ApiWorkspace[]> {
  return apiFetch<ApiWorkspace[]>(token, "/workspaces");
}

export async function fetchCurrentWorkspace(
  token: string,
): Promise<ApiWorkspace> {
  return apiFetch<ApiWorkspace>(token, "/workspaces/current");
}

export async function fetchWorkspace(
  token: string,
  workspaceId: string,
): Promise<ApiWorkspaceDetail> {
  return apiFetch<ApiWorkspaceDetail>(token, `/workspaces/${workspaceId}`);
}

export async function createClientWorkspace(
  token: string,
  body: CreateClientWorkspaceBody,
): Promise<ApiWorkspaceDetail> {
  return apiFetch<ApiWorkspaceDetail>(token, "/workspaces", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateClientWorkspace(
  token: string,
  workspaceId: string,
  body: UpdateClientWorkspaceBody,
): Promise<ApiWorkspaceDetail> {
  return apiFetch<ApiWorkspaceDetail>(token, `/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteClientWorkspace(
  token: string,
  workspaceId: string,
): Promise<DeleteClientWorkspaceResponse> {
  return apiFetch<DeleteClientWorkspaceResponse>(
    token,
    `/workspaces/${workspaceId}`,
    {
      method: "DELETE",
    },
  );
}
