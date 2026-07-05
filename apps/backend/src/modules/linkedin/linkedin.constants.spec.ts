import {
  buildLinkedInOAuthScopes,
  LINKEDIN_BASE_OAUTH_SCOPES,
} from './linkedin.constants';

describe('buildLinkedInOAuthScopes', () => {
  it('returns OIDC + publish scopes', () => {
    expect(buildLinkedInOAuthScopes()).toEqual([...LINKEDIN_BASE_OAUTH_SCOPES]);
  });
});
