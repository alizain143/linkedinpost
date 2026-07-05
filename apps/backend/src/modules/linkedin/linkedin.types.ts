export type LinkedInEnrichmentStatus =
  | 'none'
  | 'pending'
  | 'complete'
  | 'failed';

export type LinkedInEnrichmentSource = 'api_only' | 'user_import' | null;

/** OIDC userinfo + optional best-effort identityMe + optional user import. */
export interface LinkedInProfileData {
  memberId: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  pictureUrl: string | null;
  /** Filled by user import; null with OIDC-only sync. */
  headline: string | null;
  /** About section; filled by user import. */
  summary: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  profileUrl: string | null;
  locale: string | null;
  /** 0–1 from identityMe; full history from user import. */
  positions: LinkedInPositionSummary[];
  education: LinkedInEducationSummary[];
  syncedAt: string;
  enrichmentStatus: LinkedInEnrichmentStatus;
  enrichmentSource: LinkedInEnrichmentSource;
  enrichedAt: string | null;
  /** Field names last written by user import (e.g. headline, summary, positions). */
  importedFields: string[];
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
  clerkExternalAccountId: string | null;
}

export interface LinkedInPublishResult {
  linkedInPostId: string;
  linkedInPostUrl: string | null;
}
