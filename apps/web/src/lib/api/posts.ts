import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiPostMedia,
  ApiPostPackage,
  ApiPostVersion,
  CreatePostBody,
  DeletePostResponse,
  ListPostsParams,
  RejectPostBody,
  RequestChangesBody,
  TransitionPostStatusBody,
  UpdatePostBody,
} from "@/lib/api/types/post";
import type { ApiGenerationJob, GenerateMediaRequestBody } from "@/lib/api/types/generation";
import type { SchedulePostBody } from "@/lib/api/types/scheduling";

function postsPath(workspaceId: string, postId?: string, suffix?: string): string {
  const base = `/workspaces/${workspaceId}/posts`;
  if (!postId) return base;
  const path = `${base}/${postId}`;
  return suffix ? `${path}/${suffix}` : path;
}

function buildListQuery(params?: ListPostsParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.status?.length) {
    search.set("status", params.status.join(","));
  }
  if (params.postType) search.set("postType", params.postType);
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchPosts(
  token: string,
  workspaceId: string,
  params?: ListPostsParams,
): Promise<ApiPostPackage[]> {
  return apiFetch<ApiPostPackage[]>(
    token,
    `${postsPath(workspaceId)}${buildListQuery(params)}`,
  );
}

export async function fetchPost(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(token, postsPath(workspaceId, postId));
}

export async function createPost(
  token: string,
  workspaceId: string,
  body: CreatePostBody,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(token, postsPath(workspaceId), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePost(
  token: string,
  workspaceId: string,
  postId: string,
  body: UpdatePostBody,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(token, postsPath(workspaceId, postId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePost(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<DeletePostResponse> {
  return apiFetch<DeletePostResponse>(token, postsPath(workspaceId, postId), {
    method: "DELETE",
  });
}

export async function fetchPostVersions(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiPostVersion[]> {
  return apiFetch<ApiPostVersion[]>(
    token,
    postsPath(workspaceId, postId, "versions"),
  );
}

export async function applyPostVersion(
  token: string,
  workspaceId: string,
  postId: string,
  versionNumber: number,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, `versions/${versionNumber}/apply`),
    { method: "POST" },
  );
}

export async function fetchPostMediaVersions(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiPostMedia[]> {
  return apiFetch<ApiPostMedia[]>(
    token,
    postsPath(workspaceId, postId, "media-versions"),
  );
}

export async function applyPostMediaVersion(
  token: string,
  workspaceId: string,
  postId: string,
  mediaId: string,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, `media/${mediaId}/apply`),
    { method: "POST" },
  );
}

export async function transitionPostStatus(
  token: string,
  workspaceId: string,
  postId: string,
  body: TransitionPostStatusBody,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    `${postsPath(workspaceId, postId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function approvePost(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "approve"),
    { method: "POST" },
  );
}

export async function generatePostMedia(
  token: string,
  workspaceId: string,
  postId: string,
  body: GenerateMediaRequestBody = {},
): Promise<ApiGenerationJob> {
  return apiFetch<ApiGenerationJob>(
    token,
    postsPath(workspaceId, postId, "generate-media"),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function applyPostChanges(
  token: string,
  workspaceId: string,
  postId: string,
  body: { additionalFeedback?: string } = {},
): Promise<ApiGenerationJob> {
  return apiFetch<ApiGenerationJob>(
    token,
    postsPath(workspaceId, postId, "apply-changes"),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function rejectPost(
  token: string,
  workspaceId: string,
  postId: string,
  body: RejectPostBody = {},
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "reject"),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function requestChangesPost(
  token: string,
  workspaceId: string,
  postId: string,
  body: RequestChangesBody,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "request-changes"),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function schedulePost(
  token: string,
  workspaceId: string,
  postId: string,
  body: SchedulePostBody,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "schedule"),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function reschedulePost(
  token: string,
  workspaceId: string,
  postId: string,
  body: SchedulePostBody,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "schedule"),
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function cancelSchedule(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "schedule"),
    { method: "DELETE" },
  );
}

export async function publishPost(
  token: string,
  workspaceId: string,
  postId: string,
): Promise<ApiPostPackage> {
  return apiFetch<ApiPostPackage>(
    token,
    postsPath(workspaceId, postId, "publish"),
    { method: "POST" },
  );
}
