import { buildPostMediaStorageKey } from './media-storage-keys';

describe('buildPostMediaStorageKey', () => {
  it('builds workspace-scoped key', () => {
    expect(
      buildPostMediaStorageKey('ws-1', 'post-1', 'media-1'),
    ).toBe('workspaces/ws-1/posts/post-1/media/media-1.png');
  });
});
