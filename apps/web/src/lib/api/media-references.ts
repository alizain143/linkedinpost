import { apiBaseUrl } from "@/lib/api/client-core";
import type {
  MediaReferenceCandidate,
  SubmitMediaReferencesBody,
} from "@/lib/api/types/media-references";

function jobsPath(workspaceId: string, jobId: string, suffix?: string) {
  const base = `${apiBaseUrl()}/workspaces/${workspaceId}/jobs/${jobId}`;
  return suffix ? `${base}/${suffix}` : base;
}

export async function fetchMediaReferences(
  workspaceId: string,
  jobId: string,
  token: string,
): Promise<MediaReferenceCandidate[]> {
  const response = await fetch(jobsPath(workspaceId, jobId, "media-references"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = (await response.json()) as {
    data?: { candidates: MediaReferenceCandidate[] };
  };
  if (!response.ok || !payload.data) {
    throw new Error("Failed to load media references");
  }
  return payload.data.candidates;
}

export async function submitMediaReferences(
  workspaceId: string,
  jobId: string,
  token: string,
  body: SubmitMediaReferencesBody,
): Promise<void> {
  const response = await fetch(jobsPath(workspaceId, jobId, "media-references"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Failed to submit media references");
  }
}
