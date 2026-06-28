import { apiFetch } from "@/lib/api/fetch";
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
  return apiFetch<InitUploadResult>(token, "/documents/init", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      purpose,
    }),
  });
}
