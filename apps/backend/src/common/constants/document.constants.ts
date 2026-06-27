export enum DocumentPurpose {
  PROFILE = 'profile',
  USER_DOCUMENT = 'user_document',
}

export enum DocumentAttachedToType {
  USER = 'user',
}

export const DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const USER_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PURPOSE_MIME_TYPES: Record<DocumentPurpose, readonly string[]> = {
  [DocumentPurpose.PROFILE]: PROFILE_IMAGE_MIME_TYPES,
  [DocumentPurpose.USER_DOCUMENT]: USER_DOCUMENT_MIME_TYPES,
};

export const PURPOSE_MAX_SIZE_BYTES: Record<DocumentPurpose, number> = {
  [DocumentPurpose.PROFILE]: PROFILE_IMAGE_MAX_SIZE_BYTES,
  [DocumentPurpose.USER_DOCUMENT]: DOCUMENT_MAX_SIZE_BYTES,
};

export const ATTACHMENT_PURPOSE: Record<
  DocumentAttachedToType,
  DocumentPurpose
> = {
  [DocumentAttachedToType.USER]: DocumentPurpose.PROFILE,
};

export const DOCUMENT_PRESIGNED_URL_TTL_SECONDS = 15 * 60;
export const DOCUMENT_PENDING_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function buildPublicObjectUrl(
  baseUrl: string,
  storageKey: string,
): string {
  return `${baseUrl.replace(/\/$/, '')}/${storageKey}`;
}
