import { ConflictException, ForbiddenException } from '@nestjs/common';
import {
  assertCanStartLinkedInConnect,
  assertLinkedInMemberMatches,
} from './linkedin-identity-lock';

describe('linkedin-identity-lock', () => {
  describe('assertLinkedInMemberMatches', () => {
    it('allows first connect when no locked member', () => {
      expect(() =>
        assertLinkedInMemberMatches({
          lockedMemberId: null,
          incomingMemberId: 'member-new',
        }),
      ).not.toThrow();
    });

    it('allows reconnect with the same member', () => {
      expect(() =>
        assertLinkedInMemberMatches({
          lockedMemberId: 'member-1',
          incomingMemberId: 'member-1',
          lockedProfileName: 'Ada Lovelace',
        }),
      ).not.toThrow();
    });

    it('rejects a different LinkedIn member with a friendly error', () => {
      expect(() =>
        assertLinkedInMemberMatches({
          lockedMemberId: 'member-1',
          incomingMemberId: 'member-2',
          lockedProfileName: 'Ada Lovelace',
        }),
      ).toThrow(ForbiddenException);

      try {
        assertLinkedInMemberMatches({
          lockedMemberId: 'member-1',
          incomingMemberId: 'member-2',
          lockedProfileName: 'Ada Lovelace',
        });
      } catch (err) {
        const response = (err as ForbiddenException).getResponse() as {
          code: string;
          error: string;
        };
        expect(response.code).toBe('LINKEDIN_ACCOUNT_MISMATCH');
        expect(response.error).toContain('Ada Lovelace');
        expect(response.error).toContain('Agency client workspace');
      }
    });
  });

  describe('assertCanStartLinkedInConnect', () => {
    it('blocks when tokens are present', () => {
      expect(() =>
        assertCanStartLinkedInConnect({
          linkedInAccessToken: 'tok',
          linkedInClerkExternalAccountId: null,
        }),
      ).toThrow(ConflictException);
    });

    it('allows when disconnected (identity may still be locked)', () => {
      expect(() =>
        assertCanStartLinkedInConnect({
          linkedInAccessToken: null,
          linkedInClerkExternalAccountId: null,
        }),
      ).not.toThrow();
    });
  });
});
