import { PostPackageStatus, PostSource, PostType } from '@prisma/client';
import { buildPost, buildPostVersion } from '../../test/fixtures';
import {
  buildVersionSnapshot,
  toPostPackageResponse,
  toPostPackageSummary,
  toPostVersionResponse,
} from './post.mapper';

describe('post.mapper', () => {
  describe('toPostPackageResponse', () => {
    it('maps post fields and version count from _count', () => {
      const post = {
        ...buildPost(),
        _count: { versions: 3 },
      };

      const result = toPostPackageResponse(post);

      expect(result.id).toBe(post.id);
      expect(result.hook).toBe('Test hook');
      expect(result.status).toBe(PostPackageStatus.draft);
      expect(result.versionNumber).toBe(3);
    });

    it('uses explicit versionNumber when provided', () => {
      const result = toPostPackageResponse(buildPost(), 5);
      expect(result.versionNumber).toBe(5);
    });
  });

  describe('toPostPackageSummary', () => {
    it('returns pipeline card fields only', () => {
      const result = toPostPackageSummary(buildPost());

      expect(result).toEqual({
        id: expect.any(String),
        hook: 'Test hook',
        pillar: 'Founder lessons',
        postType: PostType.personal_story,
        source: PostSource.manual,
        status: PostPackageStatus.draft,
        score: null,
        scheduledAt: null,
        updatedAt: expect.any(Date),
      });
      expect(result).not.toHaveProperty('body');
    });
  });

  describe('toPostVersionResponse', () => {
    it('maps version fields', () => {
      const version = buildPostVersion({ versionNumber: 2, cta: 'Ask me' });
      const result = toPostVersionResponse(version);

      expect(result.versionNumber).toBe(2);
      expect(result.cta).toBe('Ask me');
      expect(result.postPackageId).toBe(version.postPackageId);
    });
  });

  describe('buildVersionSnapshot', () => {
    it('captures content fields for versioning', () => {
      expect(
        buildVersionSnapshot({
          hook: 'H',
          body: 'B',
          cta: 'C',
          tags: ['#a'],
        }),
      ).toEqual({
        hook: 'H',
        body: 'B',
        cta: 'C',
        tags: ['#a'],
      });
    });
  });
});
