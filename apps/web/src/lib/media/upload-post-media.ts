import {
  confirmPostMediaUpload,
  initPostMediaUpload,
  type InitPostMediaUploadFile,
} from "@/lib/api/posts";
import { apiBaseUrl, parseApiResponse } from "@/lib/api/client-core";
import {
  isAllowedPostMediaMimeType,
  validatePostMediaFiles,
} from "@/lib/media/post-media-upload";
import type { ApiPostPackage } from "@/lib/api/types/post";

export type UploadPostMediaFile = {
  file: File;
  altText?: string;
};

async function uploadSlotViaApi({
  token,
  uploadPath,
  file,
}: {
  token: string;
  uploadPath: string;
  file: File;
}): Promise<void> {
  const path = uploadPath.startsWith("/") ? uploadPath : `/${uploadPath}`;
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: form,
  });

  await parseApiResponse<{ uploaded: boolean }>(response);
}

export async function uploadPostMediaFiles({
  token,
  workspaceId,
  postId,
  files,
  replace = true,
}: {
  token: string;
  workspaceId: string;
  postId: string;
  files: UploadPostMediaFile[];
  replace?: boolean;
}): Promise<ApiPostPackage> {
  const validationError = validatePostMediaFiles(files.map((f) => f.file));
  if (validationError) {
    throw new Error(validationError);
  }

  const payload: InitPostMediaUploadFile[] = files.map((item, index) => {
    if (!isAllowedPostMediaMimeType(item.file.type)) {
      throw new Error("Use a JPEG or PNG image.");
    }
    return {
      filename: item.file.name,
      mimeType: item.file.type,
      sizeBytes: item.file.size,
      altText: item.altText,
      sortOrder: index,
    };
  });

  const { uploads } = await initPostMediaUpload(
    token,
    workspaceId,
    postId,
    payload,
  );

  const sorted = [...uploads].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const slot of sorted) {
    const file = files[slot.sortOrder]?.file;
    if (!file) {
      throw new Error("Upload slot did not match a selected file.");
    }
    await uploadSlotViaApi({
      token,
      uploadPath: slot.uploadUrl,
      file,
    });
  }

  return confirmPostMediaUpload(token, workspaceId, postId, {
    postMediaIds: sorted.map((slot) => slot.postMediaId),
    replace,
  });
}
