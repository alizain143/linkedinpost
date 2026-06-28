import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiApprovalsResponse,
  ApprovalsQueryParams,
} from "@/lib/api/types/approvals";

function buildApprovalsQuery(params?: ApprovalsQueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.tab) search.set("tab", params.tab);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchApprovals(
  token: string,
  workspaceId: string,
  params?: ApprovalsQueryParams,
): Promise<ApiApprovalsResponse> {
  return apiFetch<ApiApprovalsResponse>(
    token,
    `/workspaces/${workspaceId}/approvals${buildApprovalsQuery(params)}`,
  );
}
