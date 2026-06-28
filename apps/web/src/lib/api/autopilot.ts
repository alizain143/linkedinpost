import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiAutopilotConfig,
  UpsertAutopilotConfigBody,
} from "@/lib/api/types/autopilot";
import type { ApiPostPackage } from "@/lib/api/types/post";

function autopilotPath(workspaceId: string, suffix?: string): string {
  const base = `/workspaces/${workspaceId}/autopilot`;
  return suffix ? `${base}/${suffix}` : base;
}

export async function fetchAutopilotConfig(
  token: string,
  workspaceId: string,
): Promise<ApiAutopilotConfig> {
  return apiFetch<ApiAutopilotConfig>(token, autopilotPath(workspaceId));
}

export async function upsertAutopilotConfig(
  token: string,
  workspaceId: string,
  body: UpsertAutopilotConfigBody,
): Promise<ApiAutopilotConfig> {
  return apiFetch<ApiAutopilotConfig>(token, autopilotPath(workspaceId), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchAutopilotPlannedPosts(
  token: string,
  workspaceId: string,
): Promise<ApiPostPackage[]> {
  return apiFetch<ApiPostPackage[]>(token, autopilotPath(workspaceId, "planned"));
}
