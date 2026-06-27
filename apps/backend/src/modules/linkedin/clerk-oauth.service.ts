import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { LINKEDIN_PUBLISH_SCOPE } from './linkedin.constants';

const LINKEDIN_PROVIDER_ALIASES = new Set([
  'oauth_linkedin_oidc',
  'linkedin_oidc',
  'linkedin',
]);

@Injectable()
export class ClerkOAuthService {
  constructor(private readonly configService: ConfigService) {}

  private getClerkClient() {
    return createClerkClient({
      secretKey: this.configService.get<string>('clerk.secretKey'),
    });
  }

  private provider() {
    return this.configService.get<string>(
      'linkedin.clerkProvider',
      'oauth_linkedin_oidc',
    );
  }

  async getLinkedInExternalAccount(clerkId: string) {
    const clerkUser = await this.getClerkClient().users.getUser(clerkId);
    const account = clerkUser.externalAccounts.find((item) =>
      LINKEDIN_PROVIDER_ALIASES.has(item.provider),
    );

    if (!account || account.verification?.status !== 'verified') {
      return null;
    }

    return account;
  }

  getApprovedScopes(account: { approvedScopes?: string } | null | undefined) {
    if (!account?.approvedScopes) return [] as string[];
    return account.approvedScopes
      .split(/\s+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  hasPublishScope(scopes: string[]) {
    return scopes.includes(LINKEDIN_PUBLISH_SCOPE);
  }

  async getLinkedInAccessToken(clerkId: string): Promise<string> {
    const account = await this.getLinkedInExternalAccount(clerkId);
    if (!account) {
      throw new UnauthorizedException({
        error: 'LinkedIn is not connected',
        code: 'LINKEDIN_NOT_CONNECTED',
      });
    }

    const scopes = this.getApprovedScopes(account);
    if (!this.hasPublishScope(scopes)) {
      throw new UnauthorizedException({
        error: 'LinkedIn publish permission is required',
        code: 'LINKEDIN_SCOPE_MISSING',
      });
    }

    const response = await this.getClerkClient().users.getUserOauthAccessToken(
      clerkId,
      this.provider() as 'oauth_linkedin_oidc',
    );

    const token = response.data[0]?.token;
    if (!token) {
      throw new BadRequestException({
        error: 'LinkedIn access token is unavailable',
        code: 'LINKEDIN_TOKEN_UNAVAILABLE',
      });
    }

    return token;
  }
}
