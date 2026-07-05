import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { LinkedInApiClient } from './linkedin-api.client';
import { buildLinkedInOAuthScopes } from './linkedin.constants';
import {
  loadWorkspaceLinkedIn,
  storeWorkspaceLinkedInTokensUpdate,
  syncWorkspaceLinkedInUpdate,
} from './workspace-linkedin.store';
import { Prisma } from '@prisma/client';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

type OAuthStatePayload = {
  workspaceId: string;
  userId: string;
  exp: number;
};

type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
};

@Injectable()
export class LinkedInOAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly linkedInApiClient: LinkedInApiClient,
  ) {}

  isDirectOAuthConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('linkedin.clientId') &&
        this.configService.get<string>('linkedin.clientSecret'),
    );
  }

  async createAuthorizationUrl(
    workspaceId: string,
    userId: string,
  ): Promise<string> {
    if (!this.isDirectOAuthConfigured()) {
      throw new BadRequestException({
        error: 'LinkedIn OAuth is not configured on the server',
        code: 'LINKEDIN_OAUTH_NOT_CONFIGURED',
      });
    }

    await this.workspacesService.assertMember(userId, workspaceId);

    const state = this.signState({
      workspaceId,
      userId,
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.configService.get<string>('linkedin.clientId')!,
      redirect_uri: this.configService.get<string>('linkedin.oauthRedirectUri')!,
      state,
      scope: buildLinkedInOAuthScopes().join(' '),
      // OIDC — ask LinkedIn to show sign-in when supported (may still skip if already granted)
      prompt: 'login',
      max_age: '0',
    });

    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
  }

  async handleOAuthCallback(
    code: string | undefined,
    state: string | undefined,
    error: string | undefined,
  ): Promise<string> {
    const frontendUrl = (
      process.env.FRONTEND_URL ?? 'http://localhost:3000'
    ).split(',')[0]!.trim();

    if (error || !code || !state) {
      return `${frontendUrl}/app/dashboard?linkedin=error&message=${encodeURIComponent(error ?? 'LinkedIn authorization was cancelled')}`;
    }

    const payload = this.verifyState(state);
    await this.workspacesService.assertMember(payload.userId, payload.workspaceId);

    const tokens = await this.exchangeAuthorizationCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const userinfo = await this.linkedInApiClient.fetchUserInfo(
      tokens.access_token,
    );
    let identityMe: Record<string, unknown> | null = null;
    try {
      identityMe = await this.linkedInApiClient.fetchIdentityMe(
        tokens.access_token,
      );
    } catch {
      identityMe = null;
    }
    const profile = this.linkedInApiClient.mapProfile(userinfo, identityMe);

    await this.prisma.workspace.update({
      where: { id: payload.workspaceId },
      data: {
        ...storeWorkspaceLinkedInTokensUpdate(
          tokens.access_token,
          tokens.refresh_token ?? null,
          expiresAt,
        ),
        ...syncWorkspaceLinkedInUpdate(
          profile.memberId,
          profile.fullName,
          profile as unknown as Prisma.InputJsonValue,
        ),
      },
    });

    return `${frontendUrl}/app/dashboard?linkedin=connected&workspaceId=${payload.workspaceId}`;
  }

  async getWorkspaceAccessToken(workspaceId: string): Promise<string | null> {
    const workspace = await loadWorkspaceLinkedIn(this.prisma, workspaceId);
    if (!workspace.linkedInAccessToken) return null;

    const expiresAt = workspace.linkedInTokenExpiresAt?.getTime() ?? 0;
    const isExpired = expiresAt <= Date.now() + 60_000;

    if (!isExpired) {
      return workspace.linkedInAccessToken;
    }

    if (!workspace.linkedInRefreshToken) {
      return null;
    }

    const refreshed = await this.refreshAccessToken(workspace.linkedInRefreshToken);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: storeWorkspaceLinkedInTokensUpdate(
        refreshed.access_token,
        refreshed.refresh_token ?? workspace.linkedInRefreshToken,
        newExpiresAt,
      ),
    });

    return refreshed.access_token;
  }

  workspaceHasStoredToken(workspace: {
    linkedInAccessToken: string | null;
  }): boolean {
    return Boolean(workspace.linkedInAccessToken);
  }

  private async exchangeAuthorizationCode(
    code: string,
  ): Promise<LinkedInTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.configService.get<string>('linkedin.oauthRedirectUri')!,
      client_id: this.configService.get<string>('linkedin.clientId')!,
      client_secret: this.configService.get<string>('linkedin.clientSecret')!,
    });

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new BadRequestException({
        error: 'LinkedIn token exchange failed',
        code: 'LINKEDIN_OAUTH_FAILED',
      });
    }

    return (await response.json()) as LinkedInTokenResponse;
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<LinkedInTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.configService.get<string>('linkedin.clientId')!,
      client_secret: this.configService.get<string>('linkedin.clientSecret')!,
    });

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new UnauthorizedException({
        error: 'LinkedIn token refresh failed',
        code: 'LINKEDIN_TOKEN_EXPIRED',
      });
    }

    return (await response.json()) as LinkedInTokenResponse;
  }

  private signState(payload: OAuthStatePayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.stateSecret())
      .update(body)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  private verifyState(state: string): OAuthStatePayload {
    const [body, signature] = state.split('.');
    if (!body || !signature) {
      throw new UnauthorizedException({
        error: 'Invalid OAuth state',
        code: 'LINKEDIN_OAUTH_INVALID_STATE',
      });
    }

    const expected = createHmac('sha256', this.stateSecret())
      .update(body)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expBuf.length ||
      !timingSafeEqual(sigBuf, expBuf)
    ) {
      throw new UnauthorizedException({
        error: 'Invalid OAuth state',
        code: 'LINKEDIN_OAUTH_INVALID_STATE',
      });
    }

    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as OAuthStatePayload;

    if (!payload.workspaceId || !payload.userId || !payload.exp) {
      throw new UnauthorizedException({
        error: 'Invalid OAuth state',
        code: 'LINKEDIN_OAUTH_INVALID_STATE',
      });
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException({
        error: 'OAuth state expired',
        code: 'LINKEDIN_OAUTH_STATE_EXPIRED',
      });
    }

    return payload;
  }

  private stateSecret(): string {
    return (
      this.configService.get<string>('clerk.secretKey') ??
      this.configService.get<string>('linkedin.clientSecret') ??
      'linkedin-oauth-state-dev'
    );
  }
}
