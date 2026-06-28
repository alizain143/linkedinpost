"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { fetchCredits } from "@/lib/api/credits";
import { queryKeys } from "@/lib/api/query-keys";
import type { ApiCreditsBalance } from "@/lib/api/types/credits";
import { canAffordCredits, isCreditsExhausted } from "@/lib/credit-costs";

export function useCredits() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.credits,
    enabled: isLoaded && isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchCredits(token);
    },
  });

  const balance = query.data;

  const derived = useMemo(() => {
    if (!balance) {
      return {
        isExhausted: false,
        canAfford: (_cost: number) => true,
        percentUsed: 0,
      };
    }

    return {
      isExhausted: isCreditsExhausted(balance),
      canAfford: (cost: number) => canAffordCredits(balance.remaining, cost),
      percentUsed: balance.percentUsed,
    };
  }, [balance]);

  return {
    ...query,
    balance,
    ...derived,
  };
}

export function useInvalidateCredits() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
  }, [queryClient]);
}

export type { ApiCreditsBalance };
