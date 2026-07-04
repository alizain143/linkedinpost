"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  applyPostChanges,
  approvePost,
  createPost,
  deletePost,
  fetchPost,
  fetchPosts,
  fetchPostVersions,
  generatePostMedia,
  rejectPost,
  requestChangesPost,
  transitionPostStatus,
  updatePost,
} from "@/lib/api/posts";
import { queryKeys } from "@/lib/api/query-keys";
import { invalidateNotificationQueries } from "@/lib/notification-query-invalidation";
import { invalidatePostQueries } from "@/lib/post-query-invalidation";
import type { ApiGenerationJob } from "@/lib/api/types/generation";
import type {
  ApiPostPackage,
  ApiPostVersion,
  CreatePostBody,
  ListPostsParams,
  RejectPostBody,
  RequestChangesBody,
  TransitionPostStatusBody,
  UpdatePostBody,
} from "@/lib/api/types/post";

function stableListFilters(params?: ListPostsParams): ListPostsParams | undefined {
  if (!params) return undefined;
  return {
    ...params,
    status: params.status ? [...params.status].sort() : undefined,
  };
}

type PostActionVariables = {
  postId: string;
  feedback?: string;
};

export function usePosts(
  workspaceId: string | null | undefined,
  params?: ListPostsParams,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const filters = stableListFilters(params);

  return useQuery({
    queryKey: queryKeys.posts.list(workspaceId ?? "", filters),
    enabled: isLoaded && isSignedIn && !!workspaceId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return fetchPosts(token, workspaceId, params);
    },
  });
}

export function usePost(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
  options?: { pollWhileAwaitingApproval?: boolean },
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const pollWhileAwaitingApproval = options?.pollWhileAwaitingApproval ?? false;

  return useQuery({
    queryKey: queryKeys.posts.detail(workspaceId ?? "", postId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId && !!postId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return fetchPost(token, workspaceId, postId);
    },
    refetchInterval: pollWhileAwaitingApproval
      ? (query) => {
          const status = query.state.data?.status;
          if (status === "ready_for_approval") return 15_000;
          if (status === "media_generating") return 2_500;
          return false;
        }
      : false,
  });
}

export function usePostVersions(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.posts.versions(workspaceId ?? "", postId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId && !!postId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return fetchPostVersions(token, workspaceId, postId);
    },
  });
}

export function useCreatePost(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, CreatePostBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return createPost(token, workspaceId, body);
    },
    onSuccess: () => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId);
    },
  });
}

export function useGeneratePostMediaMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiGenerationJob,
    Error,
    {
      postId: string;
      mediaCustomPrompt?: string;
      replace?: boolean;
      mediaMode?: "freestyle" | "template";
      mediaTemplateId?: string;
    }
  >({
    mutationFn: async ({
      postId,
      mediaCustomPrompt,
      replace,
      mediaMode,
      mediaTemplateId,
    }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return generatePostMedia(token, workspaceId, postId, {
        mediaCustomPrompt,
        replace,
        mediaMode,
        mediaTemplateId,
      });
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      void queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
    },
  });
}

export function useApplyPostChangesMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    ApiGenerationJob,
    Error,
    { postId: string; additionalFeedback?: string }
  >({
    mutationFn: async ({ postId, additionalFeedback }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return applyPostChanges(token, workspaceId, postId, {
        additionalFeedback,
      });
    },
    onSuccess: (job, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.credits });
      void queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
      if (workspaceId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useUpdatePost(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, UpdatePostBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return updatePost(token, workspaceId, postId, body);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
    },
  });
}

export function useDeletePost(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean }, Error, string>({
    mutationFn: async (postId) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return deletePost(token, workspaceId, postId);
    },
    onSuccess: () => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId);
    },
  });
}

export function useTransitionPostStatus(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, TransitionPostStatusBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return transitionPostStatus(token, workspaceId, postId, body);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
    },
  });
}

export function useApprovePostMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, PostActionVariables>({
    mutationFn: async ({ postId }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return approvePost(token, workspaceId, postId);
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useRejectPostMutation(workspaceId: string | null | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, PostActionVariables>({
    mutationFn: async ({ postId, feedback }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      return rejectPost(token, workspaceId, postId, { feedback });
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useRequestChangesPostMutation(
  workspaceId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, PostActionVariables>({
    mutationFn: async ({ postId, feedback }) => {
      const token = await getToken();
      if (!token || !workspaceId) throw new Error("Not authenticated");
      if (!feedback?.trim()) throw new Error("Feedback is required");
      return requestChangesPost(token, workspaceId, postId, {
        feedback: feedback.trim(),
      });
    },
    onSuccess: (_data, { postId }) => {
      if (workspaceId) invalidatePostQueries(queryClient, workspaceId, postId);
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useApprovePost(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, void>({
    mutationFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return approvePost(token, workspaceId, postId);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useRejectPost(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, RejectPostBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return rejectPost(token, workspaceId, postId, body);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useRequestChangesPost(
  workspaceId: string | null | undefined,
  postId: string | null | undefined,
) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ApiPostPackage, Error, RequestChangesBody>({
    mutationFn: async (body) => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return requestChangesPost(token, workspaceId, postId, body);
    },
    onSuccess: () => {
      if (workspaceId && postId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
      }
      invalidateNotificationQueries(queryClient);
    },
  });
}

export function useInvalidatePosts() {
  const queryClient = useQueryClient();

  return useCallback(
    (workspaceId?: string, postId?: string) => {
      if (workspaceId) {
        invalidatePostQueries(queryClient, workspaceId, postId);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    [queryClient],
  );
}

export type { ApiPostPackage, ApiPostVersion, ListPostsParams };
