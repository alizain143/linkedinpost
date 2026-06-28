"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  approvePost,
  createPost,
  deletePost,
  fetchPost,
  fetchPosts,
  fetchPostVersions,
  rejectPost,
  requestChangesPost,
  transitionPostStatus,
  updatePost,
} from "@/lib/api/posts";
import { queryKeys } from "@/lib/api/query-keys";
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

export function invalidatePostQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  postId?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: ["posts", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["pipeline", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["approvals", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["calendar", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.stats(workspaceId),
  });
  if (postId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.posts.detail(workspaceId, postId),
    });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.posts.versions(workspaceId, postId),
    });
  }
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
) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.posts.detail(workspaceId ?? "", postId ?? ""),
    enabled: isLoaded && isSignedIn && !!workspaceId && !!postId,
    queryFn: async () => {
      const token = await getToken();
      if (!token || !workspaceId || !postId) throw new Error("Not authenticated");
      return fetchPost(token, workspaceId, postId);
    },
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
