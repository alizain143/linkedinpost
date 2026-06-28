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
});
