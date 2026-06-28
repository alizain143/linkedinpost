import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiBillingStatus,
  BillingSessionResponse,
  CreateCheckoutBody,
} from "@/lib/api/types/billing";

export async function fetchBillingStatus(
  token: string,
): Promise<ApiBillingStatus> {
  return apiFetch<ApiBillingStatus>(token, "/billing");
}

export async function createCheckoutSession(
  token: string,
  body: CreateCheckoutBody,
): Promise<BillingSessionResponse> {
  return apiFetch<BillingSessionResponse>(token, "/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createPortalSession(
  token: string,
): Promise<BillingSessionResponse> {
  return apiFetch<BillingSessionResponse>(token, "/billing/portal", {
    method: "POST",
  });
}
