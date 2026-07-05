import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiLinkedInConnectionStatus,
  ApiLinkedInImportToken,
  ApiLinkedInProfile,
} from "@/lib/api/types/linkedin";
import type { ImportLinkedInProfileInput } from "@/lib/api/types/linkedin";

export async function fetchLinkedInConnection(
  token: string,
  workspaceId: string,
): Promise<ApiLinkedInConnectionStatus> {
  return apiFetch<ApiLinkedInConnectionStatus>(
    token,
    `/workspaces/${workspaceId}/linkedin/connection`,
  );
}

export async function startLinkedInOAuth(
  token: string,
  workspaceId: string,
): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(
    token,
    `/workspaces/${workspaceId}/linkedin/oauth/start`,
  );
}

export async function bindLinkedInConnection(
  token: string,
  workspaceId: string,
  clerkExternalAccountId?: string,
): Promise<ApiLinkedInConnectionStatus> {
  return apiFetch<ApiLinkedInConnectionStatus>(
    token,
    `/workspaces/${workspaceId}/linkedin/connection`,
    {
      method: "POST",
      body: clerkExternalAccountId
        ? JSON.stringify({ clerkExternalAccountId })
        : undefined,
    },
  );
}

export async function disconnectLinkedInConnection(
  token: string,
  workspaceId: string,
): Promise<ApiLinkedInConnectionStatus> {
  return apiFetch<ApiLinkedInConnectionStatus>(
    token,
    `/workspaces/${workspaceId}/linkedin/connection`,
    { method: "DELETE" },
  );
}

export async function fetchLinkedInProfile(
  token: string,
  workspaceId: string,
): Promise<ApiLinkedInProfile | null> {
  return apiFetch<ApiLinkedInProfile | null>(
    token,
    `/workspaces/${workspaceId}/linkedin/profile`,
  );
}

export async function syncLinkedInProfile(
  token: string,
  workspaceId: string,
): Promise<ApiLinkedInProfile> {
  return apiFetch<ApiLinkedInProfile>(
    token,
    `/workspaces/${workspaceId}/linkedin/profile/sync`,
    { method: "POST" },
  );
}

export async function createLinkedInImportToken(
  token: string,
  workspaceId: string,
  body?: { profileUrl?: string },
): Promise<ApiLinkedInImportToken> {
  return apiFetch<ApiLinkedInImportToken>(
    token,
    `/workspaces/${workspaceId}/linkedin/profile/import-token`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function importLinkedInProfileAuthenticated(
  token: string,
  workspaceId: string,
  body: ImportLinkedInProfileInput,
): Promise<ApiLinkedInProfile> {
  return apiFetch<ApiLinkedInProfile>(
    token,
    `/workspaces/${workspaceId}/linkedin/profile/import/authenticated`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
