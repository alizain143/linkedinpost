import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiApprovalLinkCreated,
  ApiApprovalLinkRevoked,
  ApiApprovalLinkStatus,
} from "@/lib/api/types/approval-share";

function approvalLinkPath(workspaceId: string, postId: string): string {
  return `/workspaces/${workspaceId}/posts/${postId}/approval-link`;
}

export async function createApprovalLink(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiApprovalLinkCreated> {
  return apiFetch<ApiApprovalLinkCreated>(token, approvalLinkPath(workspaceId, postId), {
    method: "POST",
  });
}

export async function fetchApprovalLinkStatus(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiApprovalLinkStatus> {
  return apiFetch<ApiApprovalLinkStatus>(token, approvalLinkPath(workspaceId, postId));
}

export async function revokeApprovalLink(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiApprovalLinkRevoked> {
  return apiFetch<ApiApprovalLinkRevoked>(token, approvalLinkPath(workspaceId, postId), {
    method: "DELETE",
  });
}
