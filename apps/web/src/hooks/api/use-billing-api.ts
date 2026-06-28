"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  createCheckoutSession,
  createPortalSession,
  fetchBillingStatus,
} from "@/lib/api/billing";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiBillingStatus,
  BillingSessionResponse,
  CreateCheckoutBody,
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

export function usePortalMutation() {
  const { getToken } = useAuth();

  return useMutation<BillingSessionResponse, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return createPortalSession(token);
    },
    onSuccess: (response) => {
      window.location.href = response.url;
    },
  });
}

export function useInvalidateBilling() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.billing.status });
    void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
  }, [queryClient]);
}

export type { ApiBillingStatus };
