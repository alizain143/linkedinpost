import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiContentProfile,
  ApproveContentProfileSuggestionsBody,
  ContentProfileSuggestionsResult,
  CreateContentProfileBody,
  DeleteContentProfileResponse,
  SuggestContentProfilesBody,
  UpdateContentProfileBody,
} from "@/lib/api/types/content-profile";

function contentProfilesPath(workspaceId: string, profileId?: string): string {
  const base = `/workspaces/${workspaceId}/content-profiles`;
  return profileId ? `${base}/${profileId}` : base;
}

export async function fetchContentProfiles(
  token: string,
  workspaceId: string,
): Promise<ApiContentProfile[]> {
  return apiFetch<ApiContentProfile[]>(
    token,
    contentProfilesPath(workspaceId),
  );
}

export async function fetchContentProfile(
  token: string,
  workspaceId: string,
  profileId: string,
): Promise<ApiContentProfile> {
  return apiFetch<ApiContentProfile>(
    token,
    contentProfilesPath(workspaceId, profileId),
  );
}

export async function createContentProfile(
  token: string,
  workspaceId: string,
  body: CreateContentProfileBody,
): Promise<ApiContentProfile> {
  return apiFetch<ApiContentProfile>(token, contentProfilesPath(workspaceId), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateContentProfile(
  token: string,
  workspaceId: string,
  profileId: string,
  body: UpdateContentProfileBody,
): Promise<ApiContentProfile> {
  return apiFetch<ApiContentProfile>(
    token,
    contentProfilesPath(workspaceId, profileId),
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteContentProfile(
  token: string,
  workspaceId: string,
  profileId: string,
): Promise<DeleteContentProfileResponse> {
  return apiFetch<DeleteContentProfileResponse>(
    token,
    contentProfilesPath(workspaceId, profileId),
    { method: "DELETE" },
  );
}

export async function suggestContentProfiles(
  token: string,
  workspaceId: string,
  body: SuggestContentProfilesBody,
): Promise<ContentProfileSuggestionsResult> {
  return apiFetch<ContentProfileSuggestionsResult>(
    token,
    `${contentProfilesPath(workspaceId)}/suggest`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function approveContentProfileSuggestions(
  token: string,
  workspaceId: string,
  body: ApproveContentProfileSuggestionsBody,
): Promise<ApiContentProfile[]> {
  return apiFetch<ApiContentProfile[]>(
    token,
    `${contentProfilesPath(workspaceId)}/approve-suggestions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
