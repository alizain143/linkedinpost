import { initDocumentUpload } from "@/lib/api/documents";
import { DocumentPurpose } from "@/lib/documents/constants";

export type { InitUploadResult } from "@/lib/api/documents";

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
