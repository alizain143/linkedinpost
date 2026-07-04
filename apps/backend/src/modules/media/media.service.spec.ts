import { Test, TestingModule } from '@nestjs/testing';
import { PostMediaType } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { postId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { R2BucketService } from '../storage/r2-bucket.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  const prisma = createMockPrismaService();
  const r2Storage = {
    getObjectBuffer: jest.fn(),
    putObject: jest.fn(),
    deleteObject: jest.fn(),
    createDownloadUrl: jest.fn(),
  };
  const r2BucketService = {
    assertPostMediaSize: jest.fn(),
    resolvePostMediaBucket: jest.fn(() => 'post-media'),
    getPostMediaPublicUrl: jest.fn(() => null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: prisma },
        { provide: R2StorageService, useValue: r2Storage },
        { provide: R2BucketService, useValue: r2BucketService },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it('returns null when post has no media', async () => {
    prisma.postMedia.findFirst.mockResolvedValue(null);

    await expect(service.getPrimaryPublishMedia(postId)).resolves.toBeNull();
  });

  it('returns buffer for primary png media', async () => {
    prisma.postMedia.findFirst.mockResolvedValue({
      id: 'media-1',
      postPackageId: postId,
      storageBucket: 'post-media',
      storageKey: 'ws/post/media-1.png',
      mimeType: 'image/png',
      altText: 'Quote card',
      mediaType: PostMediaType.generated,
      sortOrder: 0,
    });
    r2Storage.getObjectBuffer.mockResolvedValue(Buffer.from('png-bytes'));

    const result = await service.getPrimaryPublishMedia(postId);

    expect(result).toEqual({
      buffer: Buffer.from('png-bytes'),
      mimeType: 'image/png',
      altText: 'Quote card',
    });
    expect(r2Storage.getObjectBuffer).toHaveBeenCalledWith(
      'post-media',
      'ws/post/media-1.png',
    );
  });

  it('returns buffer for jpeg media', async () => {
    prisma.postMedia.findFirst.mockResolvedValue({
      id: 'media-2',
      postPackageId: postId,
      storageBucket: 'post-media',
      storageKey: 'ws/post/media-2.jpg',
      mimeType: 'image/jpeg',
      altText: 'Quote card',
    });
    r2Storage.getObjectBuffer.mockResolvedValue(Buffer.from('jpeg-bytes'));

    const result = await service.getPrimaryPublishMedia(postId);

    expect(result?.mimeType).toBe('image/jpeg');
  });

  it('fails for unsupported mime types', async () => {
    prisma.postMedia.findFirst.mockResolvedValue({
      id: 'media-1',
      postPackageId: postId,
      storageBucket: 'post-media',
      storageKey: 'ws/post/media-1.webp',
      mimeType: 'image/webp',
      altText: 'Quote card',
    });

    await expect(service.getPrimaryPublishMedia(postId)).rejects.toMatchObject({
      code: 'LINKEDIN_MEDIA_UNSUPPORTED',
    });
    expect(r2Storage.getObjectBuffer).not.toHaveBeenCalled();
  });

  it('fails when R2 read fails', async () => {
    prisma.postMedia.findFirst.mockResolvedValue({
      id: 'media-1',
      postPackageId: postId,
      storageBucket: 'post-media',
      storageKey: 'ws/post/media-1.png',
      mimeType: 'image/png',
      altText: 'Quote card',
    });
    r2Storage.getObjectBuffer.mockRejectedValue(new Error('not found'));

    await expect(service.getPrimaryPublishMedia(postId)).rejects.toMatchObject({
      code: 'LINKEDIN_MEDIA_READ_FAILED',
    });
  });
});
