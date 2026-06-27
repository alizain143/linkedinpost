export enum DocumentPurpose {
  PROFILE = "profile",
  USER_DOCUMENT = "user_document",
}

export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function isAllowedProfileMimeType(mimeType: string) {
  return (PROFILE_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function getProfileImageAccept() {
  return PROFILE_IMAGE_MIME_TYPES.join(",");
}
