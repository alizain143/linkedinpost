import { Injectable } from '@nestjs/common';
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
      where: { councilRunId: input.councilRunId },
    });

    for (const row of existing) {
      await this.r2Storage
        .deleteObject(row.storageBucket, row.storageKey)
        .catch(() => undefined);
    }

    if (existing.length > 0) {
      await this.prisma.postMedia.deleteMany({
        where: { councilRunId: input.councilRunId },
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

    const media = await this.prisma.postMedia.create({
      data: {
        id: postMediaId,
        postPackageId: input.postPackageId,
        councilRunId: input.councilRunId,
        mediaType: input.mediaType,
        source: 'council',
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
  }

  async listForPost(postPackageId: string): Promise<PostMediaResponse[]> {
    const rows = await this.prisma.postMedia.findMany({
      where: { postPackageId },
      orderBy: { sortOrder: 'asc' },
    });

    return Promise.all(
      rows.map(async (row) =>
        toPostMediaResponse(row, await this.resolveUrl(row.storageBucket, row.storageKey)),
      ),
    );
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
      where: { postPackageId },
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
