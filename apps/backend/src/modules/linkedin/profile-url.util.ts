/** Extract vanity slug from a LinkedIn profile URL, e.g. linkedin.com/in/jane-doe → jane-doe */
export function extractLinkedInProfileSlug(profileUrl: string): string | null {
  try {
    const url = new URL(profileUrl);
    const match = url.pathname.match(/\/in\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]).toLowerCase();
  } catch {
    const match = profileUrl.match(/linkedin\.com\/in\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]).toLowerCase();
  }
}

export function linkedInProfileSlugsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return extractLinkedInProfileSlug(a) === extractLinkedInProfileSlug(b);
}
