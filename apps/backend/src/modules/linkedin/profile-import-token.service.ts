import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

const IMPORT_TOKEN_TTL_SECONDS = 10 * 60;

export interface ProfileImportTokenPayload {
  workspaceId: string;
  userId: string;
  exp: number;
}

@Injectable()
export class ProfileImportTokenService {
  constructor(private readonly configService: ConfigService) {}

  createToken(workspaceId: string, userId: string): { token: string; expiresAt: string } {
    const exp = Math.floor(Date.now() / 1000) + IMPORT_TOKEN_TTL_SECONDS;
    const payload: ProfileImportTokenPayload = { workspaceId, userId, exp };
    const token = this.sign(payload);
    return { token, expiresAt: new Date(exp * 1000).toISOString() };
  }

  verifyToken(token: string, workspaceId: string): ProfileImportTokenPayload {
    const payload = this.verify(token);

    if (payload.workspaceId !== workspaceId) {
      throw new UnauthorizedException({
        error: 'Import token does not match workspace',
        code: 'LINKEDIN_IMPORT_TOKEN_INVALID',
      });
    }

    return payload;
  }

  private sign(payload: ProfileImportTokenPayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  private verify(token: string): ProfileImportTokenPayload {
    const [body, signature] = token.split('.');
    if (!body || !signature) {
      throw new UnauthorizedException({
        error: 'Invalid import token',
        code: 'LINKEDIN_IMPORT_TOKEN_INVALID',
      });
    }

    const expected = createHmac('sha256', this.secret())
      .update(body)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expBuf.length ||
      !timingSafeEqual(sigBuf, expBuf)
    ) {
      throw new UnauthorizedException({
        error: 'Invalid import token',
        code: 'LINKEDIN_IMPORT_TOKEN_INVALID',
      });
    }

    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as ProfileImportTokenPayload;

    if (!payload.workspaceId || !payload.userId || !payload.exp) {
      throw new UnauthorizedException({
        error: 'Invalid import token',
        code: 'LINKEDIN_IMPORT_TOKEN_INVALID',
      });
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException({
        error: 'Import token expired',
        code: 'LINKEDIN_IMPORT_TOKEN_EXPIRED',
      });
    }

    return payload;
  }

  private secret(): string {
    return (
      this.configService.get<string>('clerk.secretKey') ??
      this.configService.get<string>('linkedin.clientSecret') ??
      'linkedin-import-token-dev'
    );
  }
}
