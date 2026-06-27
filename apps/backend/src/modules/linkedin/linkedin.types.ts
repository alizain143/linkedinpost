/** OIDC userinfo + optional best-effort identityMe. Not a full LinkedIn profile export. */
export interface LinkedInProfileData {
  memberId: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  pictureUrl: string | null;
  /** Always null with OIDC-only sync (not available without legacy/partner APIs). */
  headline: string | null;
  /** Always null with OIDC-only sync (not available without legacy/partner APIs). */
  summary: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  profileUrl: string | null;
  locale: string | null;
  /** 0–1 entries from identityMe primaryCurrentPosition when LinkedIn returns it. */
  positions: LinkedInPositionSummary[];
  education: LinkedInEducationSummary[];
  syncedAt: string;
}

export interface LinkedInPositionSummary {
  title: string | null;
  companyName: string | null;
  companyPageUrl: string | null;
  startedOn: { month?: number; year?: number } | null;
  isCurrent: boolean;
}

export interface LinkedInEducationSummary {
  schoolName: string | null;
  degreeName: string | null;
  fieldOfStudy: string | null;
  startedOn: { month?: number; year?: number } | null;
  endedOn: { month?: number; year?: number } | null;
}

export interface LinkedInConnectionStatus {
  connected: boolean;
  publishReady: boolean;
  profileName: string | null;
  approvedScopes: string[];
  linkedInMemberId: string | null;
}

export interface LinkedInPublishResult {
  linkedInPostId: string;
  linkedInPostUrl: string | null;
}
