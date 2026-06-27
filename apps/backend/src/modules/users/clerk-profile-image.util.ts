export function resolveClerkProfileImageUrl(
  imageUrl: string | null | undefined,
  hasImage: boolean | null | undefined,
): string | null {
  if (!hasImage || !imageUrl) {
    return null;
  }

  return imageUrl;
}
