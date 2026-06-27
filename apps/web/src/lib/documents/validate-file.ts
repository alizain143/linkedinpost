import {
  DocumentPurpose,
  isAllowedProfileMimeType,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
} from "@/lib/documents/constants";

export function validateFileForPurpose(
  file: File,
  purpose: DocumentPurpose,
): string | null {
  if (purpose !== DocumentPurpose.PROFILE) {
    return "Unsupported document purpose.";
  }

  if (!file.type) {
    return "Could not determine file type.";
  }

  if (!isAllowedProfileMimeType(file.type)) {
    return "Use a JPEG, PNG, or WebP image.";
  }

  if (file.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}
