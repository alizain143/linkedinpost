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

  async getLinkedInExternalAccount(
    clerkId: string,
    externalAccountId?: string | null,
  ) {
    const clerkUser = await this.getClerkClient().users.getUser(clerkId);
    const linkedInCandidates = clerkUser.externalAccounts.filter((item) =>
      LINKEDIN_PROVIDER_ALIASES.has(item.provider),
    );

    if (externalAccountId) {
      const bound = linkedInCandidates.find(
        (item) => item.id === externalAccountId,
      );
      if (
        !bound ||
        bound.verification?.status !== 'verified'
      ) {
        return null;
      }
      return bound;
    }

    const verifiedCandidates = linkedInCandidates.filter(
      (item) => item.verification?.status === 'verified',
    );
    const account =
      verifiedCandidates.find((item) =>
        this.hasPublishScope(this.getApprovedScopes(item)),
      ) ?? verifiedCandidates[0];

    if (!account || account.verification?.status !== 'verified') {
      return null;
    }

    return account;
  }

  async listVerifiedLinkedInExternalAccounts(clerkId: string) {
    const clerkUser = await this.getClerkClient().users.getUser(clerkId);
    return clerkUser.externalAccounts.filter(
      (item) =>
        LINKEDIN_PROVIDER_ALIASES.has(item.provider) &&
        item.verification?.status === 'verified',
    );
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

  async getLinkedInAccessToken(
    clerkId: string,
    externalAccountId?: string | null,
  ): Promise<string> {
    const account = await this.getLinkedInExternalAccount(
      clerkId,
      externalAccountId,
    );
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

    const tokenEntry = externalAccountId
      ? response.data.find(
          (entry) => entry.externalAccountId === externalAccountId,
        )
      : response.data[0];

    const token = tokenEntry?.token;
    if (!token) {
      throw new BadRequestException({
        error: 'LinkedIn access token is unavailable',
        code: 'LINKEDIN_TOKEN_UNAVAILABLE',
      });
    }

    return token;
  }
}
