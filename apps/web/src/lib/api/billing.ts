import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiBillingStatus,
  ApiBillingTransactionsResponse,
  BillingSessionResponse,
  CancelSubscriptionResponse,
  CreateCheckoutBody,
  CreateCreditCheckoutBody,
  CreditTopupQuote,
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

export async function cancelSubscription(
  token: string,
): Promise<CancelSubscriptionResponse> {
  return apiFetch<CancelSubscriptionResponse>(token, "/billing/cancel", {
    method: "POST",
  });
}

export async function fetchCreditQuote(
  token: string,
  credits: number,
): Promise<CreditTopupQuote> {
  return apiFetch<CreditTopupQuote>(
    token,
    `/billing/credits/quote?credits=${credits}`,
  );
}

export async function createCreditCheckoutSession(
  token: string,
  body: CreateCreditCheckoutBody,
): Promise<BillingSessionResponse> {
  return apiFetch<BillingSessionResponse>(token, "/billing/credits/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchBillingTransactions(
  token: string,
  params?: { limit?: number; cursor?: string | null },
): Promise<ApiBillingTransactionsResponse> {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  return apiFetch<ApiBillingTransactionsResponse>(
    token,
    `/billing/transactions${qs ? `?${qs}` : ""}`,
  );
}
