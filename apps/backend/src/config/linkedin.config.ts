import { registerAs } from '@nestjs/config';

export default registerAs('linkedin', () => ({
  publishMock: process.env.LINKEDIN_PUBLISH_MOCK === 'true',
  apiVersion: process.env.LINKEDIN_API_VERSION ?? '202601',
  restBaseUrl: process.env.LINKEDIN_REST_BASE_URL ?? 'https://api.linkedin.com/rest',
  userinfoUrl: process.env.LINKEDIN_USERINFO_URL ?? 'https://api.linkedin.com/v2/userinfo',
  identityMeUrl:
    process.env.LINKEDIN_IDENTITY_ME_URL ?? 'https://api.linkedin.com/rest/identityMe',
  clerkProvider: 'oauth_linkedin_oidc' as const,
  publishScope: 'w_member_social',
}));
