export type ApiLinkedInConnectionStatus = {
  connected: boolean;
  publishReady: boolean;
  profileName: string | null;
  approvedScopes: string[];
  linkedInMemberId: string | null;
  clerkExternalAccountId: string | null;
};

export type ApiLinkedInEnrichmentStatus =
  | "none"
  | "pending"
  | "complete"
  | "failed";

export type ApiLinkedInEnrichmentSource = "api_only" | "user_import" | null;

export type ApiLinkedInPositionSummary = {
  title: string | null;
  companyName: string | null;
  companyPageUrl: string | null;
  startedOn: { month?: number; year?: number } | null;
  isCurrent: boolean;
};

export type ApiLinkedInEducationSummary = {
  schoolName: string | null;
  degreeName: string | null;
  fieldOfStudy: string | null;
};

export type ApiLinkedInProfile = {
  memberId: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  pictureUrl: string | null;
  headline: string | null;
  summary: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  profileUrl: string | null;
  locale: string | null;
  positions: ApiLinkedInPositionSummary[];
  education: ApiLinkedInEducationSummary[];
  syncedAt: string;
  enrichmentStatus?: ApiLinkedInEnrichmentStatus;
  enrichmentSource?: ApiLinkedInEnrichmentSource;
  enrichedAt?: string | null;
  importedFields?: string[];
};

export type ApiLinkedInImportToken = {
  token: string;
  expiresAt: string;
  linkedInImportUrl: string;
  expectedProfileSlug: string;
  profileName?: string | null;
};

export type ImportLinkedInProfileInput = {
  profileUrl: string;
  headline?: string | null;
  summary?: string | null;
  experienceText?: string;
  positions?: ApiLinkedInPositionSummary[];
  education?: ApiLinkedInEducationSummary[];
  importToken?: string;
};

export const LINKEDIN_IMPORT_SESSION_KEY = "lp_staged_import";
export const LINKEDIN_IMPORT_EXPECTED_SLUG_KEY = "lp_import_expected_slug";
export const LINKEDIN_IMPORT_REVIEW_PARAM = "importReview";
