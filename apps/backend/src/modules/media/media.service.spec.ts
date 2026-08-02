import { Test, TestingModule } from '@nestjs/testing';
import {
  PostMediaType,
  PostMediaUploadStatus,
} from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { postId, workspaceId } from '../../test/fixtures';
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
    createUploadUrl: jest.fn(),
    verifyUploadedObject: jest.fn(),
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
  });

  it('rejects init with zero files', async () => {
    prisma.postMedia.findMany.mockResolvedValue([]);

    await expect(
      service.initUploadedMedia({
        workspaceId,
        postPackageId: postId,
        files: [],
      }),
    ).rejects.toMatchObject({ response: { code: 'INVALID_UPLOAD_FILE_COUNT' } });
  });

  it('inits pending upload slots', async () => {
    prisma.postMedia.findMany.mockResolvedValue([]);
    prisma.postMedia.create.mockImplementation(async ({ data }: { data: { id: string } }) => ({
      ...data,
    }));

    const result = await service.initUploadedMedia({
      workspaceId,
      postPackageId: postId,
      files: [
        {
          filename: 'a.png',
          mimeType: 'image/png',
          sizeBytes: 100,
          sortOrder: 0,
        },
      ],
    });

    expect(result.uploads).toHaveLength(1);
    expect(result.uploads[0].uploadUrl).toContain(
      `/workspaces/${workspaceId}/posts/${postId}/media/uploads/`,
    );
    expect(prisma.postMedia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mediaType: PostMediaType.uploaded,
          uploadStatus: PostMediaUploadStatus.pending,
        }),
      }),
    );
    expect(r2Storage.createUploadUrl).not.toHaveBeenCalled();
  });

  it('confirms uploads and archives prior active media', async () => {
    const pending = {
      id: 'pending-1',
      postPackageId: postId,
      mediaBatchId: 'batch-1',
      mediaType: PostMediaType.uploaded,
      uploadStatus: PostMediaUploadStatus.pending,
      storageBucket: 'post-media',
      storageKey: 'key.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      altText: 'Uploaded image',
      sortOrder: 0,
    };
    prisma.postMedia.findMany
      .mockResolvedValueOnce([pending])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          ...pending,
          uploadStatus: PostMediaUploadStatus.ready,
          archivedAt: null,
          mediaBatchId: 'batch-1',
        },
      ]);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.postMedia.updateMany.mockResolvedValue({ count: 1 });
    prisma.postPackage.update.mockResolvedValue({});
    r2Storage.verifyUploadedObject.mockResolvedValue(undefined);
    r2Storage.createDownloadUrl.mockResolvedValue('https://cdn.example/1.png');

    const result = await service.confirmUploadedMedia({
      workspaceId,
      postPackageId: postId,
      postMediaIds: ['pending-1'],
      replace: true,
    });

    expect(r2Storage.verifyUploadedObject).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].mediaType).toBe(PostMediaType.uploaded);
  });

  it('restores a full media batch on apply', async () => {
    const slide1 = {
      id: 'm1',
      postPackageId: postId,
      mediaBatchId: 'batch-9',
      uploadStatus: null,
      archivedAt: new Date(),
      sortOrder: 0,
      storageBucket: 'post-media',
      storageKey: 'a.png',
      mimeType: 'image/png',
      sizeBytes: 10,
      altText: 'a',
      mediaType: PostMediaType.generated,
      createdAt: new Date(),
    };
    const slide2 = {
      ...slide1,
      id: 'm2',
      sortOrder: 1,
      storageKey: 'b.png',
      altText: 'b',
    };

    prisma.postMedia.findFirst.mockResolvedValue(slide1);
    prisma.postMedia.findMany
      .mockResolvedValueOnce([slide1, slide2])
      .mockResolvedValueOnce([
        { ...slide1, archivedAt: null },
        { ...slide2, archivedAt: null },
      ]);
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn(prisma),
    );
    prisma.postMedia.updateMany.mockResolvedValue({ count: 2 });
    prisma.postPackage.update.mockResolvedValue({});
    r2Storage.createDownloadUrl
      .mockResolvedValueOnce('https://cdn/a.png')
      .mockResolvedValueOnce('https://cdn/b.png');

    const result = await service.applyMediaVersion(postId, 'm1');

    expect(result).toHaveLength(2);
    expect(prisma.postPackage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mediaFormat: 'carousel' }),
      }),
    );
  });
});
