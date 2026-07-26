"use client";

import { useAuth } from "@clerk/nextjs";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import {
  cancelSubscription,
  createCheckoutSession,
  createCreditCheckoutSession,
  fetchBillingStatus,
  fetchBillingTransactions,
  fetchCreditQuote,
} from "@/lib/api/billing";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiBillingStatus,
  BillingSessionResponse,
  CancelSubscriptionResponse,
  CreateCheckoutBody,
  CreateCreditCheckoutBody,
  CreditTopupQuote,
} from "@/lib/api/types/billing";

export function useBillingStatus() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.billing.status,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchBillingStatus(token);
    },
  });
}

export function useCheckoutMutation() {
  const { getToken } = useAuth();

  return useMutation<BillingSessionResponse, Error, CreateCheckoutBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createCheckoutSession(token, body);
    },
    onSuccess: (response) => {
      window.location.href = response.url;
    },
  });
}

export function useCancelSubscriptionMutation() {
  const { getToken } = useAuth();
  const invalidateBilling = useInvalidateBilling();

  return useMutation<CancelSubscriptionResponse, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return cancelSubscription(token);
    },
    onSuccess: () => {
      invalidateBilling();
    },
  });
}

export function useCreditQuote(credits: number | null, enabled = true) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["billing", "credits", "quote", credits],
    enabled:
      enabled &&
      isLoaded &&
      isSignedIn &&
      credits != null &&
      Number.isInteger(credits) &&
      credits >= 25 &&
      credits <= 2000,
    queryFn: async (): Promise<CreditTopupQuote> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchCreditQuote(token, credits!);
    },
    placeholderData: (previous) => previous,
  });
}

export function useCreditCheckoutMutation() {
  const { getToken } = useAuth();

  return useMutation<BillingSessionResponse, Error, CreateCreditCheckoutBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createCreditCheckoutSession(token, body);
    },
    onSuccess: (response) => {
      window.location.href = response.url;
    },
  });
}

export function useBillingTransactions() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useInfiniteQuery({
    queryKey: queryKeys.billing.transactions(),
    enabled: isLoaded && isSignedIn,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchBillingTransactions(token, {
        limit: 20,
        cursor: pageParam,
      });
    },
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useInvalidateBilling() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.billing.status });
    void queryClient.invalidateQueries({
      queryKey: ["billing", "transactions"],
    });
    void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
  }, [queryClient]);
}

export type { ApiBillingStatus };
