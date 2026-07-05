/** Extract vanity slug from a LinkedIn profile URL, e.g. linkedin.com/in/jane-doe → jane-doe */
export function extractLinkedInProfileSlug(
  profileUrl: string,
): string | null {
  try {
    const url = new URL(profileUrl);
    const match = url.pathname.match(/\/in\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    const slug = decodeURIComponent(match[1]).toLowerCase();
    if (slug === "me") return null;
    return slug;
  } catch {
    const match = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    const slug = decodeURIComponent(match[1]).toLowerCase();
    if (slug === "me") return null;
    return slug;
  }
}

export function isUsableLinkedInProfileUrl(
  profileUrl: string | null | undefined,
): boolean {
  if (!profileUrl?.trim()) return false;
  return Boolean(extractLinkedInProfileSlug(profileUrl.trim()));
}
