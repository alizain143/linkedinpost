export const PUBLISH_JOBS_QUEUE = 'publish-jobs';
export const LINKEDIN_PUBLISH_SCOPE = 'w_member_social';

/** Request on connect/reauthorize — publish + Verified on LinkedIn profile scopes. */
export const LINKEDIN_CONNECT_SCOPES = [
  LINKEDIN_PUBLISH_SCOPE,
  'r_profile_basicinfo',
  'r_primary_current_experience',
  'r_most_recent_education',
] as const;

export const LINKEDIN_PROFILE_SCOPE_SET = new Set<string>(
  LINKEDIN_CONNECT_SCOPES,
);
