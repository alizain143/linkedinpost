import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  MediaFormat,
  PostMediaType,
  PostMediaUploadStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  extensionForPostMediaMime,
  POST_MEDIA_MIME_TYPES,
  POST_MEDIA_PENDING_MAX_AGE_MS,
  POST_MEDIA_UPLOAD_TTL_SECONDS,
  UPLOADED_MEDIA_MAX_FILES,
  UPLOADED_MEDIA_MIN_FILES,
} from '../../common/constants/media.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { LinkedInPublishError } from '../linkedin/linkedin-publish.error';
import { R2BucketService } from '../storage/r2-bucket.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { buildPostMediaStorageKey } from './media-storage-keys';
import { PublishMediaListPayload, PublishMediaPayload } from './media-publish.types';
import {
  AttachCarouselMediaInput,
  AttachCouncilMediaInput,
  ConfirmUploadedMediaInput,
  InitUploadedMediaInput,
  InitUploadedMediaSlot,
  PostMediaResponse,
  toPostMediaResponse,
} from './media.types';

const ACTIVE_MEDIA_WHERE: Prisma.PostMediaWhereInput = {
  archivedAt: null,
  OR: [{ uploadStatus: null }, { uploadStatus: PostMediaUploadStatus.ready }],
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Storage: R2StorageService,
    private readonly r2BucketService: R2BucketService,
  ) {}

  async attachCarouselMedia(
    input: AttachCarouselMediaInput,
  ): Promise<PostMediaResponse[]> {
    const mediaBatchId = input.mediaBatchId ?? input.generationJobId;
    const existing = await this.prisma.postMedia.findMany({
      where: { generationJobId: input.generationJobId },
    });

    for (const row of existing) {
      try {
        await this.r2Storage.deleteObject(row.storageBucket, row.storageKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete replaced media ${row.id} from R2: ${error}`,
        );
      }
    }

    if (existing.length > 0) {
      await this.prisma.postMedia.deleteMany({
        where: { generationJobId: input.generationJobId },
      });
    }

    const created: PostMediaResponse[] = [];

    for (const slide of input.slides) {
      this.r2BucketService.assertPostMediaSize(slide.imageBuffer.length);

      const postMediaId = randomUUID();
      const storageBucket = this.r2BucketService.resolvePostMediaBucket();
      const storageKey = buildPostMediaStorageKey(
        input.workspaceId,
        input.postPackageId,
        postMediaId,
        extensionForPostMediaMime(slide.mimeType),
      );

      await this.r2Storage.putObject(
        storageBucket,
        storageKey,
        slide.imageBuffer,
        slide.mimeType,
      );

      try {
        const media = await this.prisma.postMedia.create({
          data: {
            id: postMediaId,
            postPackageId: input.postPackageId,
            generationJobId: input.generationJobId,
            mediaBatchId,
            mediaType: slide.mediaType,
            storageKey,
            storageBucket,
            mimeType: slide.mimeType,
            sizeBytes: slide.imageBuffer.length,
            altText: slide.altText,
            sortOrder: slide.sortOrder,
          },
        });

        const url = await this.resolveUrl(media.storageBucket, media.storageKey);
        created.push(toPostMediaResponse(media, url));
      } catch (error) {
        try {
          await this.r2Storage.deleteObject(storageBucket, storageKey);
        } catch (cleanupError) {
          this.logger.warn(
            `Failed to rollback R2 object after DB error: ${cleanupError}`,
          );
        }
        throw error;
      }
    }

    return created;
  }

  async attachCouncilMedia(
    input: AttachCouncilMediaInput,
  ): Promise<PostMediaResponse> {
    this.r2BucketService.assertPostMediaSize(input.imageBuffer.length);

    const mediaBatchId = input.mediaBatchId ?? input.generationJobId;
    const existing = await this.prisma.postMedia.findMany({
      where: { generationJobId: input.generationJobId },
    });

    for (const row of existing) {
      try {
        await this.r2Storage.deleteObject(row.storageBucket, row.storageKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete replaced media ${row.id} from R2: ${error}`,
        );
      }
    }

    if (existing.length > 0) {
      await this.prisma.postMedia.deleteMany({
        where: { generationJobId: input.generationJobId },
      });
    }

    const postMediaId = randomUUID();
    const storageBucket = this.r2BucketService.resolvePostMediaBucket();
    const storageKey = buildPostMediaStorageKey(
      input.workspaceId,
      input.postPackageId,
      postMediaId,
      extensionForPostMediaMime(input.mimeType),
    );

    await this.r2Storage.putObject(
      storageBucket,
      storageKey,
      input.imageBuffer,
      input.mimeType,
    );

    try {
      const media = await this.prisma.postMedia.create({
        data: {
          id: postMediaId,
          postPackageId: input.postPackageId,
          generationJobId: input.generationJobId,
          mediaBatchId,
          mediaType: input.mediaType,
          storageKey,
          storageBucket,
          mimeType: input.mimeType,
          sizeBytes: input.imageBuffer.length,
          altText: input.altText,
          sortOrder: 0,
        },
      });

      const url = await this.resolveUrl(media.storageBucket, media.storageKey);
      return toPostMediaResponse(media, url);
    } catch (error) {
      try {
        await this.r2Storage.deleteObject(storageBucket, storageKey);
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to rollback R2 object after DB error: ${cleanupError}`,
        );
      }
      throw error;
    }
  }

  async initUploadedMedia(
    input: InitUploadedMediaInput,
  ): Promise<{ mediaBatchId: string; uploads: InitUploadedMediaSlot[] }> {
    await this.cleanupExpiredPendingUploads(input.postPackageId);

    if (
      input.files.length < UPLOADED_MEDIA_MIN_FILES ||
      input.files.length > UPLOADED_MEDIA_MAX_FILES
    ) {
      throw new BadRequestException({
        error: `Upload between ${UPLOADED_MEDIA_MIN_FILES} and ${UPLOADED_MEDIA_MAX_FILES} images`,
        code: 'INVALID_UPLOAD_FILE_COUNT',
      });
    }

    const sortOrders = input.files.map((file) => file.sortOrder).sort((a, b) => a - b);
    for (let i = 0; i < sortOrders.length; i++) {
      if (sortOrders[i] !== i) {
        throw new BadRequestException({
          error: 'sortOrder values must be contiguous starting at 0',
          code: 'INVALID_UPLOAD_SORT_ORDER',
        });
      }
    }

    for (const file of input.files) {
      if (
        !POST_MEDIA_MIME_TYPES.includes(
          file.mimeType as (typeof POST_MEDIA_MIME_TYPES)[number],
        )
      ) {
        throw new BadRequestException({
          error: 'Only JPEG and PNG images are allowed',
          code: 'FILE_TYPE_NOT_ALLOWED',
        });
      }
      this.r2BucketService.assertPostMediaSize(file.sizeBytes);
    }

    const mediaBatchId = randomUUID();
    const uploadExpiresAt = new Date(
      Date.now() + POST_MEDIA_UPLOAD_TTL_SECONDS * 1000,
    );
    const storageBucket = this.r2BucketService.resolvePostMediaBucket();
    const uploads: InitUploadedMediaSlot[] = [];

    for (const file of input.files) {
      const postMediaId = randomUUID();
      const storageKey = buildPostMediaStorageKey(
        input.workspaceId,
        input.postPackageId,
        postMediaId,
        extensionForPostMediaMime(file.mimeType),
      );

      try {
        await this.prisma.postMedia.create({
          data: {
            id: postMediaId,
            postPackageId: input.postPackageId,
            mediaBatchId,
            mediaType: PostMediaType.uploaded,
            uploadStatus: PostMediaUploadStatus.pending,
            uploadExpiresAt,
            storageKey,
            storageBucket,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
            altText: file.altText?.trim() || 'Uploaded image',
            sortOrder: file.sortOrder,
            archivedAt: new Date(),
          },
        });

        // Browser uploads via API proxy (avoids R2 CORS). Path is relative to /v1.
        uploads.push({
          postMediaId,
          uploadUrl: `/workspaces/${input.workspaceId}/posts/${input.postPackageId}/media/uploads/${postMediaId}`,
          sortOrder: file.sortOrder,
        });
      } catch (error) {
        await this.rollbackPendingBatch(mediaBatchId);
        throw error;
      }
    }

    return { mediaBatchId, uploads };
  }

  async putPendingUploadBytes(input: {
    postPackageId: string;
    postMediaId: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<void> {
    const row = await this.prisma.postMedia.findFirst({
      where: {
        id: input.postMediaId,
        postPackageId: input.postPackageId,
        mediaType: PostMediaType.uploaded,
        uploadStatus: PostMediaUploadStatus.pending,
      },
    });

    if (!row) {
      throw new BadRequestException({
        error: 'Upload slot not found or already confirmed',
        code: 'UPLOAD_SLOTS_INVALID',
      });
    }

    if (
      !POST_MEDIA_MIME_TYPES.includes(
        input.mimeType as (typeof POST_MEDIA_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException({
        error: 'Only JPEG and PNG images are allowed',
        code: 'FILE_TYPE_NOT_ALLOWED',
      });
    }

    if (input.mimeType !== row.mimeType) {
      throw new BadRequestException({
        error: 'Uploaded file type does not match init',
        code: 'UPLOAD_VERIFY_FAILED',
      });
    }

    this.r2BucketService.assertPostMediaSize(input.buffer.length);

    await this.r2Storage.putObject(
      row.storageBucket,
      row.storageKey,
      input.buffer,
      input.mimeType,
    );

    await this.prisma.postMedia.update({
      where: { id: row.id },
      data: { sizeBytes: input.buffer.length },
    });
  }

  async confirmUploadedMedia(
    input: ConfirmUploadedMediaInput,
  ): Promise<PostMediaResponse[]> {
    if (input.postMediaIds.length === 0) {
      throw new BadRequestException({
        error: 'At least one postMediaId is required',
        code: 'INVALID_UPLOAD_CONFIRM',
      });
    }

    const rows = await this.prisma.postMedia.findMany({
      where: {
        id: { in: input.postMediaIds },
        postPackageId: input.postPackageId,
        mediaType: PostMediaType.uploaded,
        uploadStatus: PostMediaUploadStatus.pending,
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (rows.length !== input.postMediaIds.length) {
      throw new BadRequestException({
        error: 'One or more upload slots were not found or already confirmed',
        code: 'UPLOAD_SLOTS_INVALID',
      });
    }

    const batchIds = new Set(rows.map((row) => row.mediaBatchId));
    if (batchIds.size !== 1 || !rows[0]?.mediaBatchId) {
      throw new BadRequestException({
        error: 'Upload confirm must include a single media batch',
        code: 'UPLOAD_BATCH_MISMATCH',
      });
    }

    const mediaBatchId = rows[0].mediaBatchId;

    for (const row of rows) {
      try {
        await this.r2Storage.verifyUploadedObject(
          row.storageBucket,
          row.storageKey,
          row.mimeType,
          row.sizeBytes,
        );
      } catch {
        throw new BadRequestException({
          error: 'Uploaded file verification failed',
          code: 'UPLOAD_VERIFY_FAILED',
        });
      }
    }

    const replace = input.replace !== false;

    await this.prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.postMedia.updateMany({
          where: {
            postPackageId: input.postPackageId,
            archivedAt: null,
            id: { notIn: rows.map((row) => row.id) },
            OR: [
              { uploadStatus: null },
              { uploadStatus: PostMediaUploadStatus.ready },
            ],
          },
          data: { archivedAt: new Date() },
        });
      }

      await tx.postMedia.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: {
          uploadStatus: PostMediaUploadStatus.ready,
          uploadExpiresAt: null,
          archivedAt: null,
        },
      });

      const mediaFormat =
        rows.length === 1 ? MediaFormat.single : MediaFormat.carousel;

      await tx.postPackage.update({
        where: { id: input.postPackageId },
        data: {
          mediaFormat,
          carouselSlideCount: rows.length > 1 ? rows.length : null,
        },
      });
    });

    // Clean leftover pending rows from the same batch that were not confirmed
    const leftovers = await this.prisma.postMedia.findMany({
      where: {
        mediaBatchId,
        uploadStatus: PostMediaUploadStatus.pending,
        id: { notIn: rows.map((row) => row.id) },
      },
    });
    await this.deleteMediaRows(leftovers);

    return this.listForPost(input.postPackageId);
  }

  async clearActiveMedia(postPackageId: string): Promise<void> {
    await this.archiveActiveForPost(postPackageId);
  }

  async listForPost(postPackageId: string): Promise<PostMediaResponse[]> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId, ...ACTIVE_MEDIA_WHERE },
      orderBy: { sortOrder: 'asc' },
    });

    return Promise.all(
      rows.map(async (row) =>
        toPostMediaResponse(
          row,
          await this.resolveUrl(row.storageBucket, row.storageKey),
        ),
      ),
    );
  }

  async listForPosts(
    postPackageIds: string[],
  ): Promise<Map<string, PostMediaResponse[]>> {
    const result = new Map<string, PostMediaResponse[]>();
    if (postPackageIds.length === 0) {
      return result;
    }

    const rows = await this.prisma.postMedia.findMany({
      where: {
        postPackageId: { in: postPackageIds },
        ...ACTIVE_MEDIA_WHERE,
      },
      orderBy: [{ postPackageId: 'asc' }, { sortOrder: 'asc' }],
    });

    for (const id of postPackageIds) {
      result.set(id, []);
    }

    for (const row of rows) {
      const url = await this.resolveUrl(row.storageBucket, row.storageKey);
      const list = result.get(row.postPackageId) ?? [];
      list.push(toPostMediaResponse(row, url));
      result.set(row.postPackageId, list);
    }

    return result;
  }

  async listVersionsForPost(
    postPackageId: string,
  ): Promise<PostMediaResponse[]> {
    const rows = await this.prisma.postMedia.findMany({
      where: {
        postPackageId,
        OR: [
          { uploadStatus: null },
          { uploadStatus: PostMediaUploadStatus.ready },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      rows.map(async (row) =>
        toPostMediaResponse(
          row,
          await this.resolveUrl(row.storageBucket, row.storageKey),
        ),
      ),
    );
  }

  async archiveActiveForPost(postPackageId: string): Promise<void> {
    await this.prisma.postMedia.updateMany({
      where: { postPackageId, ...ACTIVE_MEDIA_WHERE },
      data: { archivedAt: new Date() },
    });
  }

  async applyMediaVersion(
    postPackageId: string,
    mediaId: string,
  ): Promise<PostMediaResponse[]> {
    const target = await this.prisma.postMedia.findFirst({
      where: {
        id: mediaId,
        postPackageId,
        OR: [
          { uploadStatus: null },
          { uploadStatus: PostMediaUploadStatus.ready },
        ],
      },
    });

    if (!target) {
      throw new NotFoundException({
        error: 'Media not found on this post',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const restoreRows =
      target.mediaBatchId != null
        ? await this.prisma.postMedia.findMany({
            where: {
              postPackageId,
              mediaBatchId: target.mediaBatchId,
              OR: [
                { uploadStatus: null },
                { uploadStatus: PostMediaUploadStatus.ready },
              ],
            },
            orderBy: { sortOrder: 'asc' },
          })
        : [target];

    await this.prisma.$transaction(async (tx) => {
      await tx.postMedia.updateMany({
        where: {
          postPackageId,
          archivedAt: null,
          OR: [
            { uploadStatus: null },
            { uploadStatus: PostMediaUploadStatus.ready },
          ],
        },
        data: { archivedAt: new Date() },
      });

      await tx.postMedia.updateMany({
        where: { id: { in: restoreRows.map((row) => row.id) } },
        data: { archivedAt: null },
      });

      const mediaFormat =
        restoreRows.length === 1 ? MediaFormat.single : MediaFormat.carousel;

      await tx.postPackage.update({
        where: { id: postPackageId },
        data: {
          mediaFormat,
          carouselSlideCount:
            restoreRows.length > 1 ? restoreRows.length : null,
        },
      });
    });

    return this.listForPost(postPackageId);
  }

  async deleteAllForPost(postPackageId: string): Promise<void> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId },
    });
    await this.deleteMediaRows(rows);
  }

  async resolveUrl(storageBucket: string, storageKey: string): Promise<string> {
    const publicUrl = this.r2BucketService.getPostMediaPublicUrl(storageKey);

    if (publicUrl) {
      return publicUrl;
    }

    return this.r2Storage.createDownloadUrl(storageBucket, storageKey);
  }

  async getPublishMediaList(
    postPackageId: string,
  ): Promise<PublishMediaListPayload> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId, ...ACTIVE_MEDIA_WHERE },
      orderBy: { sortOrder: 'asc' },
    });

    if (rows.length === 0) {
      return [];
    }

    const payloads: PublishMediaListPayload = [];

    for (const media of rows) {
      if (
        !POST_MEDIA_MIME_TYPES.includes(
          media.mimeType as (typeof POST_MEDIA_MIME_TYPES)[number],
        )
      ) {
        throw new LinkedInPublishError(
          `Unsupported post media mime type: ${media.mimeType}`,
          'LINKEDIN_MEDIA_UNSUPPORTED',
        );
      }

      try {
        const buffer = await this.r2Storage.getObjectBuffer(
          media.storageBucket,
          media.storageKey,
        );
        payloads.push({
          buffer,
          mimeType: media.mimeType,
          altText: media.altText,
        });
      } catch {
        throw new LinkedInPublishError(
          'Failed to read post media from storage',
          'LINKEDIN_MEDIA_READ_FAILED',
        );
      }
    }

    return payloads;
  }

  async getPrimaryPublishMedia(
    postPackageId: string,
  ): Promise<PublishMediaPayload | null> {
    const media = await this.prisma.postMedia.findFirst({
      where: { postPackageId, ...ACTIVE_MEDIA_WHERE },
      orderBy: { sortOrder: 'asc' },
    });

    if (!media) {
      return null;
    }

    if (
      !POST_MEDIA_MIME_TYPES.includes(
        media.mimeType as (typeof POST_MEDIA_MIME_TYPES)[number],
      )
    ) {
      throw new LinkedInPublishError(
        `Unsupported post media mime type: ${media.mimeType}`,
        'LINKEDIN_MEDIA_UNSUPPORTED',
      );
    }

    try {
      const buffer = await this.r2Storage.getObjectBuffer(
        media.storageBucket,
        media.storageKey,
      );

      return {
        buffer,
        mimeType: media.mimeType,
        altText: media.altText,
      };
    } catch {
      throw new LinkedInPublishError(
        'Failed to read post media from storage',
        'LINKEDIN_MEDIA_READ_FAILED',
      );
    }
  }

  private async cleanupExpiredPendingUploads(
    postPackageId: string,
  ): Promise<void> {
    const cutoff = new Date(Date.now() - POST_MEDIA_PENDING_MAX_AGE_MS);
    const expired = await this.prisma.postMedia.findMany({
      where: {
        postPackageId,
        uploadStatus: PostMediaUploadStatus.pending,
        OR: [
          { uploadExpiresAt: { lt: new Date() } },
          { createdAt: { lt: cutoff } },
        ],
      },
    });
    await this.deleteMediaRows(expired);
  }

  private async rollbackPendingBatch(mediaBatchId: string): Promise<void> {
    const rows = await this.prisma.postMedia.findMany({
      where: { mediaBatchId, uploadStatus: PostMediaUploadStatus.pending },
    });
    await this.deleteMediaRows(rows);
  }

  private async deleteMediaRows(
    rows: Array<{ id: string; storageBucket: string; storageKey: string }>,
  ): Promise<void> {
    for (const row of rows) {
      try {
        await this.r2Storage.deleteObject(row.storageBucket, row.storageKey);
      } catch (error) {
        this.logger.warn(`Failed to delete media ${row.id} from R2: ${error}`);
      }
    }

    if (rows.length > 0) {
      await this.prisma.postMedia.deleteMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
    }
  }
}
