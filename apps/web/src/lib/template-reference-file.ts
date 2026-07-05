export const TEMPLATE_REFERENCE_MAX_BYTES = 6 * 1024 * 1024;

export const TEMPLATE_REFERENCE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf";

const ALLOWED_MIME_TYPES = new Set(
  TEMPLATE_REFERENCE_ACCEPT.split(",").map((t) => t.trim()),
);

export type AiTemplateReferenceFile = {
  mimeType: string;
  data: string;
  fileName?: string;
};

export function isTemplateReferenceMimeType(
  mimeType: string,
): mimeType is AiTemplateReferenceFile["mimeType"] {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export async function readTemplateReferenceFile(
  file: File,
): Promise<AiTemplateReferenceFile> {
  if (!isTemplateReferenceMimeType(file.type)) {
    throw new Error("Use a PNG, JPG, WebP, GIF, or PDF file");
  }
  if (file.size > TEMPLATE_REFERENCE_MAX_BYTES) {
    throw new Error("Reference file must be under 6 MB");
  }

  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Could not read file"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  return {
    mimeType: file.type,
    data,
    fileName: file.name,
  };
}

export function templateReferencePreviewUrl(
  reference: AiTemplateReferenceFile,
): string | null {
  if (!reference.mimeType.startsWith("image/")) return null;
  return `data:${reference.mimeType};base64,${reference.data}`;
}
