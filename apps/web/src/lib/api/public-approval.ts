import { publicApiFetch } from "@/lib/api/fetch";
import type {
  ApiPublicApprovalAction,
  ApiPublicApprovalPreview,
  PublicRejectBody,
  PublicRequestChangesBody,
} from "@/lib/api/types/approval-share";

function publicApprovalPath(token: string, action?: string): string {
  const base = `/public/approval/${encodeURIComponent(token)}`;
  return action ? `${base}/${action}` : base;
}

export async function fetchPublicApprovalPreview(
  token: string,
): Promise<ApiPublicApprovalPreview> {
  return publicApiFetch<ApiPublicApprovalPreview>(publicApprovalPath(token));
}

export async function publicApprove(token: string): Promise<ApiPublicApprovalAction> {
  return publicApiFetch<ApiPublicApprovalAction>(publicApprovalPath(token, "approve"), {
    method: "POST",
  });
}

export async function publicRequestChanges(
  token: string,
  body: PublicRequestChangesBody,
): Promise<ApiPublicApprovalAction> {
  return publicApiFetch<ApiPublicApprovalAction>(
    publicApprovalPath(token, "request-changes"),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function publicReject(
  token: string,
  body: PublicRejectBody = {},
): Promise<ApiPublicApprovalAction> {
  return publicApiFetch<ApiPublicApprovalAction>(publicApprovalPath(token, "reject"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}
