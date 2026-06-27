import { apiBaseUrl, authHeaders, parseApiResponse } from "@/lib/api/client";
import { DocumentPurpose } from "@/lib/documents/constants";

export type InitUploadResult = {
  documentId: string;
  uploadUrl: string;
};

export async function initDocumentUpload(
  token: string,
  file: File,
  purpose: DocumentPurpose,
): Promise<InitUploadResult> {
  const response = await fetch(`${apiBaseUrl()}/documents/init`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      purpose,
    }),
  });

  return parseApiResponse<InitUploadResult>(response);
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!response.ok) {
    throw new Error("Failed to upload file to storage");
  }
}

export async function uploadDocument({
  token,
  file,
  purpose,
}: {
  token: string;
  file: File;
  purpose: DocumentPurpose;
}): Promise<{ documentId: string }> {
  const { documentId, uploadUrl } = await initDocumentUpload(token, file, purpose);
  await uploadFileToPresignedUrl(uploadUrl, file);
  return { documentId };
}
