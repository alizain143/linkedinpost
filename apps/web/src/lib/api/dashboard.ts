import { apiFetch } from "@/lib/api/fetch";
import type { ApiDashboardStats } from "@/lib/api/types/dashboard";

export async function fetchDashboardStats(
  token: string,
  workspaceId: string,
): Promise<ApiDashboardStats> {
  return apiFetch<ApiDashboardStats>(
    token,
    `/workspaces/${workspaceId}/dashboard/stats`,
  );
}
