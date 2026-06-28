"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelSchedule,
  publishPost,
  reschedulePost,
  schedulePost,
} from "@/lib/api/posts";
import type { ApiPostPackage } from "@/lib/api/types/post";
import type { SchedulePostBody } from "@/lib/api/types/scheduling";
import { invalidatePostQueries } from "@/hooks/api/use-posts-api";

type ScheduleVariables = {
  postId: string;
  body: SchedulePostBody;
};

type PostIdVariables = {
  postId: string;
};

export function useSchedulePostMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, ScheduleVariables>({
    mutationFn: async ({ postId, body }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return schedulePost(token, workspaceId, postId, body);
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
    },
  });
}

export function useReschedulePostMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, ScheduleVariables>({
    mutationFn: async ({ postId, body }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return reschedulePost(token, workspaceId, postId, body);
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
    },
  });
}

export function useCancelScheduleMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, PostIdVariables>({
    mutationFn: async ({ postId }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return cancelSchedule(token, workspaceId, postId);
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
    },
  });
}

export function usePublishPostMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, PostIdVariables>({
    mutationFn: async ({ postId }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return publishPost(token, workspaceId, postId);
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
    },
  });
}
