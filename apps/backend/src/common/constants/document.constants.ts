export enum DocumentPurpose {
  PROFILE = 'profile',
}

export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PURPOSE_MIME_TYPES: Record<DocumentPurpose, readonly string[]> = {
  [DocumentPurpose.PROFILE]: PROFILE_IMAGE_MIME_TYPES,
};

export const PURPOSE_MAX_SIZE_BYTES: Record<DocumentPurpose, number> = {
  [DocumentPurpose.PROFILE]: PROFILE_IMAGE_MAX_SIZE_BYTES,
};

export const DOCUMENT_PRESIGNED_URL_TTL_SECONDS = 15 * 60;
export const DOCUMENT_PENDING_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function buildPublicObjectUrl(
  baseUrl: string,
  storageKey: string,
): string {
  return `${baseUrl.replace(/\/$/, '')}/${storageKey}`;
}
