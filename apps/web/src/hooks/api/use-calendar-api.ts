"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchCalendar } from "@/lib/api/calendar";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiCalendarResponse,
  CalendarQueryParams,
} from "@/lib/api/types/calendar";

function stableCalendarParams(
  params: CalendarQueryParams,
): CalendarQueryParams {
  return {
    ...params,
    status: params.status ? [...params.status].sort() : undefined,
  };
}

export function useCalendar(
  workspaceId: string | null | undefined,
  params: CalendarQueryParams,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryParams = stableCalendarParams(params);

  return useQuery({
    queryKey: queryKeys.calendar.events(workspaceId ?? "", queryParams),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchCalendar(token, workspaceId, params);
    },
  });
}

export function useInvalidateCalendar() {
  const queryClient = useQueryClient();

  return useCallback(
    (workspaceId?: string) => {
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: ["calendar", workspaceId],
        });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
    [queryClient],
  );
}

export type { ApiCalendarResponse, CalendarQueryParams };
