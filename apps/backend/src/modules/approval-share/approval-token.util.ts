import { createHash, randomBytes } from 'crypto';

export function generateApprovalRawToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashApprovalToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
