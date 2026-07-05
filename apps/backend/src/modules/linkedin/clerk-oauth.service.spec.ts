import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LINKEDIN_PUBLISH_SCOPE } from './linkedin.constants';
import { ClerkOAuthService } from './clerk-oauth.service';

describe('ClerkOAuthService', () => {
  let service: ClerkOAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkOAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              if (key === 'clerk.secretKey') return 'sk_test';
              if (key === 'linkedin.clerkProvider') return fallback;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(ClerkOAuthService);
  });

  it('parses approved scopes from external account', () => {
    const scopes = service.getApprovedScopes({
      approvedScopes: `openid profile ${LINKEDIN_PUBLISH_SCOPE}`,
    });

    expect(scopes).toContain(LINKEDIN_PUBLISH_SCOPE);
    expect(service.hasPublishScope(scopes)).toBe(true);
  });

  it('detects missing publish scope', () => {
    expect(service.hasPublishScope(['openid', 'profile'])).toBe(false);
  });

  it('selects oauth token matching external account id', async () => {
    const getUserOauthAccessToken = jest.fn().mockResolvedValue({
      data: [
        {
          externalAccountId: 'eac_other',
          token: 'wrong-token',
        },
        {
          externalAccountId: 'eac_target',
          token: 'right-token',
        },
      ],
    });
    const getUser = jest.fn().mockResolvedValue({
      externalAccounts: [
        {
          id: 'eac_target',
          provider: 'oauth_linkedin_oidc',
          verification: { status: 'verified' },
          approvedScopes: `openid profile ${LINKEDIN_PUBLISH_SCOPE}`,
        },
      ],
    });

    jest.spyOn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service as any,
      'getClerkClient',
    ).mockReturnValue({
      users: { getUser, getUserOauthAccessToken },
    });

    const token = await service.getLinkedInAccessToken(
      'user_1',
      'eac_target',
    );

    expect(token).toBe('right-token');
  });
});
