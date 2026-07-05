export const PUBLISH_JOBS_QUEUE = 'publish-jobs';
export const LINKEDIN_PUBLISH_SCOPE = 'w_member_social';

/** OIDC + publish — Sign In with LinkedIn + Share on LinkedIn products. */
export const LINKEDIN_BASE_OAUTH_SCOPES = [
  'openid',
  'profile',
  'email',
  LINKEDIN_PUBLISH_SCOPE,
] as const;

/** @deprecated Use buildLinkedInOAuthScopes() */
export const LINKEDIN_CONNECT_SCOPES = [LINKEDIN_PUBLISH_SCOPE] as const;

export const LINKEDIN_PROFILE_SCOPE_SET = new Set<string>([
  ...LINKEDIN_BASE_OAUTH_SCOPES,
]);

export function buildLinkedInOAuthScopes(): string[] {
  return [...LINKEDIN_BASE_OAUTH_SCOPES];
}
