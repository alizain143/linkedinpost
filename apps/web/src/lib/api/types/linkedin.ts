export type ApiLinkedInConnectionStatus = {
  connected: boolean;
  publishReady: boolean;
  profileName: string | null;
  approvedScopes: string[];
  linkedInMemberId: string | null;
};

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
};
