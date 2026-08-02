export const POST_MEDIA_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const POST_MEDIA_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const POST_MEDIA_MAX_FILES = 10;
export const POST_MEDIA_MIN_FILES = 1;

export type PostMediaMimeType = (typeof POST_MEDIA_MIME_TYPES)[number];

export function isAllowedPostMediaMimeType(
  mimeType: string,
): mimeType is PostMediaMimeType {
  return (POST_MEDIA_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function getPostMediaAccept(): string {
  return POST_MEDIA_MIME_TYPES.join(",");
}

export function validatePostMediaFile(file: File): string | null {
  if (!file.type) {
    return "Could not determine file type.";
  }
  if (!isAllowedPostMediaMimeType(file.type)) {
    return "Use a JPEG or PNG image.";
  }
  if (file.size > POST_MEDIA_MAX_SIZE_BYTES) {
    return "Each image must be 5 MB or smaller.";
  }
  return null;
}

export function validatePostMediaFiles(files: File[]): string | null {
  if (files.length < POST_MEDIA_MIN_FILES) {
    return "Select at least one image.";
  }
  if (files.length > POST_MEDIA_MAX_FILES) {
    return `Select up to ${POST_MEDIA_MAX_FILES} images.`;
  }
  for (const file of files) {
    const error = validatePostMediaFile(file);
    if (error) return error;
  }
  return null;
}
