import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiGenerationJob,
  CalendarGenerateRequestBody,
  CouncilRequestBody,
  QuickDraftRequestBody,
} from "@/lib/api/types/generation";

export async function generateQuickDraft(
  token: string,
  workspaceId: string,
  body: QuickDraftRequestBody,
): Promise<ApiGenerationJob> {
  return apiFetch<ApiGenerationJob>(
    token,
    `/workspaces/${workspaceId}/generate/quick`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function generateCouncil(
  token: string,
  workspaceId: string,
  body: CouncilRequestBody,
): Promise<ApiGenerationJob> {
  return apiFetch<ApiGenerationJob>(
    token,
    `/workspaces/${workspaceId}/generate/council`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function generateCalendar(
  token: string,
  workspaceId: string,
  body: CalendarGenerateRequestBody,
): Promise<ApiGenerationJob> {
  return apiFetch<ApiGenerationJob>(
    token,
    `/workspaces/${workspaceId}/generate/calendar`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function fetchGenerationJob(
  token: string,
  jobId: string,
): Promise<ApiGenerationJob> {
  return apiFetch<ApiGenerationJob>(token, `/jobs/${jobId}`);
}
