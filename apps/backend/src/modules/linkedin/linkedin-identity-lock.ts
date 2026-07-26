import { ConflictException, ForbiddenException } from '@nestjs/common';

export function isWorkspaceLinkedInActivelyConnected(workspace: {
  linkedInAccessToken: string | null;
  linkedInClerkExternalAccountId: string | null;
}): boolean {
  return Boolean(
    workspace.linkedInAccessToken || workspace.linkedInClerkExternalAccountId,
  );
}

export function assertCanStartLinkedInConnect(workspace: {
  linkedInAccessToken: string | null;
  linkedInClerkExternalAccountId: string | null;
}): void {
  if (isWorkspaceLinkedInActivelyConnected(workspace)) {
    throw new ConflictException({
      error:
        'LinkedIn is already connected to this workspace. Disconnect first to reconnect the same account.',
      code: 'LINKEDIN_ALREADY_CONNECTED',
    });
  }
}

/**
 * When a workspace has previously bound a LinkedIn member, reconnect must
 * use that same member — not a different LinkedIn login.
 */
export function assertLinkedInMemberMatches(input: {
  lockedMemberId: string | null | undefined;
  incomingMemberId: string;
  lockedProfileName?: string | null;
}): void {
  const locked = input.lockedMemberId?.trim();
  if (!locked) return;

  if (locked === input.incomingMemberId) return;

  const name = input.lockedProfileName?.trim();
  const who = name ? ` (${name})` : '';

  throw new ForbiddenException({
    error: `This workspace is locked to the previously connected LinkedIn account${who}. Sign in to LinkedIn as that account and try again. To manage a different brand, create an Agency client workspace.`,
    code: 'LINKEDIN_ACCOUNT_MISMATCH',
  });
}
