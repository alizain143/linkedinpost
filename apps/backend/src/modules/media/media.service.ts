import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PostMediaType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { POST_MEDIA_MIME_TYPES } from '../../common/constants/media.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { LinkedInPublishError } from '../linkedin/linkedin-publish.error';
import { R2BucketService } from '../storage/r2-bucket.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { buildPostMediaStorageKey } from './media-storage-keys';
import { PublishMediaPayload } from './media-publish.types';
import {
  AttachCouncilMediaInput,
  PostMediaResponse,
  toPostMediaResponse,
} from './media.types';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Storage: R2StorageService,
    private readonly r2BucketService: R2BucketService,
  ) {}

  async attachCouncilMedia(
    input: AttachCouncilMediaInput,
  ): Promise<PostMediaResponse> {
    this.r2BucketService.assertPostMediaSize(input.imageBuffer.length);

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

  async listForPost(postPackageId: string): Promise<PostMediaResponse[]> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId, archivedAt: null },
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

  async listVersionsForPost(
    postPackageId: string,
  ): Promise<PostMediaResponse[]> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId },
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
      where: { postPackageId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
  }

  async applyMediaVersion(
    postPackageId: string,
    mediaId: string,
  ): Promise<PostMediaResponse> {
    const target = await this.prisma.postMedia.findFirst({
      where: { id: mediaId, postPackageId },
    });

    if (!target) {
      throw new NotFoundException({
        error: 'Media not found on this post',
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    if (target.archivedAt == null) {
      const url = await this.resolveUrl(target.storageBucket, target.storageKey);
      return toPostMediaResponse(target, url);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.postMedia.updateMany({
        where: { postPackageId, archivedAt: null },
        data: { archivedAt: new Date() },
      });
      await tx.postMedia.update({
        where: { id: mediaId },
        data: { archivedAt: null, sortOrder: 0 },
      });
    });

    const restored = await this.prisma.postMedia.findUniqueOrThrow({
      where: { id: mediaId },
    });
    const url = await this.resolveUrl(
      restored.storageBucket,
      restored.storageKey,
    );
    return toPostMediaResponse(restored, url);
  }

  async deleteAllForPost(postPackageId: string): Promise<void> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId },
    });

    for (const row of rows) {
      try {
        await this.r2Storage.deleteObject(row.storageBucket, row.storageKey);
      } catch (error) {
        this.logger.warn(
          `Failed to delete media ${row.id} from R2: ${error}`,
        );
      }
    }

    if (rows.length > 0) {
      await this.prisma.postMedia.deleteMany({
        where: { postPackageId },
      });
    }
  }

  async resolveUrl(storageBucket: string, storageKey: string): Promise<string> {
    const publicUrl = this.r2BucketService.getPostMediaPublicUrl(storageKey);

    if (publicUrl) {
      return publicUrl;
    }

    return this.r2Storage.createDownloadUrl(storageBucket, storageKey);
  }

  async getPrimaryPublishMedia(
    postPackageId: string,
  ): Promise<PublishMediaPayload | null> {
    const media = await this.prisma.postMedia.findFirst({
      where: { postPackageId, archivedAt: null },
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
}
