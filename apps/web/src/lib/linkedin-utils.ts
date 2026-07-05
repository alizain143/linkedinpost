import type { ApiLinkedInConnectionStatus, ApiLinkedInProfile } from "@/lib/api/types/linkedin";

export type LinkedInConnectionState =
  | "disconnected"
  | "needsPublishScope"
  | "publishReady";

export function getLinkedInConnectionState(
  status: ApiLinkedInConnectionStatus | undefined,
): LinkedInConnectionState {
  if (!status?.connected) return "disconnected";
  if (!status.publishReady) return "needsPublishScope";
  return "publishReady";
}

export function getLinkedInStatusLabel(state: LinkedInConnectionState): string {
  switch (state) {
    case "disconnected":
      return "Not connected";
    case "needsPublishScope":
      return "Publish permission required";
    case "publishReady":
      return "Ready to publish";
  }
}

export function getLinkedInStatusDescription(
  state: LinkedInConnectionState,
  profileName?: string | null,
): string {
  switch (state) {
    case "disconnected":
      return "Connect LinkedIn to schedule and publish posts.";
    case "needsPublishScope":
      return profileName
        ? `${profileName} is linked, but publish permission is missing. Finish setup to schedule and publish.`
        : "Your LinkedIn account is linked, but publish permission is missing.";
    case "publishReady":
      return profileName
        ? `Connected as ${profileName}`
        : "LinkedIn is connected with publish permissions.";
  }
}

export function isLinkedInProfileEnriched(
  profile: ApiLinkedInProfile | null | undefined,
): boolean {
  return profile?.enrichmentStatus === "complete";
}

export function needsLinkedInProfileImport(
  profile: ApiLinkedInProfile | null | undefined,
): boolean {
  if (!profile) return true;
  return profile.enrichmentStatus !== "complete";
}

export function getLinkedInEnrichmentLabel(
  profile: ApiLinkedInProfile | null | undefined,
): string | null {
  if (!profile) return null;
  if (profile.enrichmentStatus === "complete") {
    return "Full profile imported";
  }
  return "Basic profile only — import for headline, About, and experience";
}

export function getLinkedInProfileSubtitle(
  profile: ApiLinkedInProfile | null | undefined,
): string | null {
  if (!profile) return null;

  const title = getLinkedInPreviewTitle(profile);
  const company = getLinkedInPreviewCompany(profile);

  if (title && company) return `${title} at ${company}`;
  if (title) return title;
  if (company) return company;
  return null;
}

export function getLinkedInPreviewTitle(
  profile: ApiLinkedInProfile | null | undefined,
): string | null {
  if (!profile) return null;

  const direct = profile.currentTitle?.trim();
  if (direct) return direct;

  const current = profile.positions.find((position) => position.isCurrent);
  const fromCurrent = current?.title?.trim();
  if (fromCurrent) return fromCurrent;

  return profile.positions[0]?.title?.trim() || null;
}

export function getLinkedInPreviewCompany(
  profile: ApiLinkedInProfile | null | undefined,
): string | null {
  if (!profile) return null;

  const direct = profile.currentCompany?.trim();
  if (direct) return direct;

  const current = profile.positions.find((position) => position.isCurrent);
  const fromCurrent = current?.companyName?.trim();
  if (fromCurrent) return fromCurrent;

  return profile.positions[0]?.companyName?.trim() || null;
}
