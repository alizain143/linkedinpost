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

export function getLinkedInProfileSubtitle(
  profile: ApiLinkedInProfile | null | undefined,
): string | null {
  if (!profile) return null;

  const title = profile.currentTitle?.trim();
  const company = profile.currentCompany?.trim();

  if (title && company) return `${title} at ${company}`;
  if (title) return title;
  if (company) return company;
  return null;
}
