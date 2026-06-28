"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  fetchGenerationJob,
  generateCalendar,
  generateCouncil,
  generateCouncilPremium,
  generateQuickDraft,
  suggestTopics,
} from "@/lib/api/generation";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  ApiGenerationJob,
  CalendarGenerateRequestBody,
  CouncilRequestBody,
  QuickDraftRequestBody,
  TopicSuggestionsRequestBody,
  TopicSuggestionsResult,
} from "@/lib/api/types/generation";
import { shouldPollJob } from "@/lib/council-utils";
import { invalidateNotificationQueries } from "@/lib/notification-query-invalidation";
import { invalidatePostQueries } from "@/lib/post-query-invalidation";

const JOB_POLL_INTERVAL_MS = 2500;

export function useQuickDraftMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiGenerationJob, Error, QuickDraftRequestBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return generateQuickDraft(token, workspaceId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
    },
  });
}

export function useTopicSuggestionsMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();

  return useMutation<TopicSuggestionsResult, Error, TopicSuggestionsRequestBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return suggestTopics(token, workspaceId, body);
    },
  });
}

export function useCouncilMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiGenerationJob, Error, CouncilRequestBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return generateCouncil(token, workspaceId, body);
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      void queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
    },
  });
}

export function usePremiumCouncilMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiGenerationJob, Error, CouncilRequestBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return generateCouncilPremium(token, workspaceId, body);
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      void queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
    },
  });
}

export function useCalendarGenerateMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiGenerationJob, Error, CalendarGenerateRequestBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return generateCalendar(token, workspaceId, body);
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      void queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
    },
  });
}

type UseGenerationJobOptions = {
  poll?: boolean;
  workspaceId?: string | null;
  onCompleted?: (job: ApiGenerationJob) => void;
};

export function useGenerationJob(
  jobId: string | null | undefined,
  options?: UseGenerationJobOptions,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const completedRef = useRef<string | null>(null);
  const onCompletedRef = useRef(options?.onCompleted);
  onCompletedRef.current = options?.onCompleted;
  const workspaceId = options?.workspaceId;
  const poll = options?.poll ?? false;

  const query = useQuery({
    queryKey: queryKeys.jobs.detail(jobId ?? ""),
    enabled: isLoaded && isSignedIn && !!jobId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !jobId) throw new Error("Not authenticated");
      return fetchGenerationJob(token, jobId);
    },
    refetchInterval: (q) => {
      if (!poll) return false;
      const status = q.state.data?.status;
      if (!status || !shouldPollJob(status)) return false;
      return JOB_POLL_INTERVAL_MS;
    },
  });

  useEffect(() => {
    const job = query.data;
    if (!job || job.status !== "completed") return;
    if (completedRef.current === job.id) return;
    completedRef.current = job.id;

    void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
    invalidateNotificationQueries(queryClient);

    if (workspaceId) {
      if (job.type === "calendar") {
        invalidatePostQueries(queryClient, workspaceId);
      } else if (job.postPackageId) {
        invalidatePostQueries(queryClient, workspaceId, job.postPackageId);
        void queryClient.invalidateQueries({
          queryKey: queryKeys.council.history(workspaceId, job.postPackageId),
        });
      }
    }

    onCompletedRef.current?.(job);
  }, [query.data, queryClient, workspaceId]);

  return query;
}
