import { buildOauthProtectedResourceMetadata } from './oauth-discovery';

describe('buildOauthProtectedResourceMetadata', () => {
  it('points authorization_servers at the frontend origin', () => {
    const meta = buildOauthProtectedResourceMetadata({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://linkedinpost.ai,https://www.linkedinpost.ai',
      PUBLIC_API_URL: 'https://api.linkedinpost.ai/v1',
    } as NodeJS.ProcessEnv);

    expect(meta.resource).toBe('https://api.linkedinpost.ai');
    expect(meta.authorization_servers).toEqual(['https://linkedinpost.ai']);
    expect(meta.bearer_methods_supported).toEqual(['header']);
    expect(meta.resource_documentation).toBe(
      'https://linkedinpost.ai/auth.md',
    );
  });
});
