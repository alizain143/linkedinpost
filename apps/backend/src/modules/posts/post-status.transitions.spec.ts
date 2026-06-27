import { ConflictException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';
import {
  ALLOWED_TRANSITIONS,
  assertValidTransition,
  PIPELINE_COLUMN_ORDER,
  PIPELINE_LABELS,
} from './post-status.transitions';

describe('post-status.transitions', () => {
  describe('ALLOWED_TRANSITIONS', () => {
    it('covers every PostPackageStatus', () => {
      const statuses = Object.values(PostPackageStatus);
      for (const status of statuses) {
        expect(ALLOWED_TRANSITIONS[status]).toBeDefined();
      }
    });

    it('blocks AI stages from manual transitions in v1', () => {
      expect(ALLOWED_TRANSITIONS[PostPackageStatus.brief_created]).toEqual([]);
      expect(ALLOWED_TRANSITIONS[PostPackageStatus.text_generating]).toEqual(
        [],
      );
    });
  });

  describe('PIPELINE_COLUMN_ORDER', () => {
    it('lists all statuses exactly once', () => {
      const statuses = Object.values(PostPackageStatus);
      expect(PIPELINE_COLUMN_ORDER).toHaveLength(statuses.length);
      expect(new Set(PIPELINE_COLUMN_ORDER).size).toBe(statuses.length);
    });

    it('starts with draft', () => {
      expect(PIPELINE_COLUMN_ORDER[0]).toBe(PostPackageStatus.draft);
    });
  });

  describe('PIPELINE_LABELS', () => {
    it('has a label for every status', () => {
      for (const status of Object.values(PostPackageStatus)) {
        expect(PIPELINE_LABELS[status]).toMatch(/\S/);
      }
    });
  });

  describe('assertValidTransition', () => {
    it('allows draft to ready_for_approval', () => {
      expect(() =>
        assertValidTransition(
          PostPackageStatus.draft,
          PostPackageStatus.ready_for_approval,
        ),
      ).not.toThrow();
    });

    it('allows approved to scheduled', () => {
      expect(() =>
        assertValidTransition(
          PostPackageStatus.approved,
          PostPackageStatus.scheduled,
        ),
      ).not.toThrow();
    });

    it('rejects draft to published', () => {
      expect(() =>
        assertValidTransition(
          PostPackageStatus.draft,
          PostPackageStatus.published,
        ),
      ).toThrow(ConflictException);

      try {
        assertValidTransition(
          PostPackageStatus.draft,
          PostPackageStatus.published,
        );
      } catch (error) {
        expect((error as ConflictException).getResponse()).toMatchObject({
          code: 'INVALID_STATUS_TRANSITION',
        });
      }
    });

    it('rejects transitions from published', () => {
      expect(() =>
        assertValidTransition(
          PostPackageStatus.published,
          PostPackageStatus.draft,
        ),
      ).toThrow(ConflictException);
    });
  });
});
