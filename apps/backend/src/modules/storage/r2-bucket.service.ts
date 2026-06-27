import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentPurpose,
  PURPOSE_MAX_SIZE_BYTES,
  buildPublicObjectUrl,
} from '../../common/constants/document.constants';

@Injectable()
export class R2BucketService {
  constructor(private readonly configService: ConfigService) {}

  resolveBucket(purpose: DocumentPurpose): string {
    const bucket = this.configService.get<string>(`r2.buckets.${purpose}`);

    if (!bucket) {
      throw new BadRequestException({
        error: 'Storage bucket not configured for this document type',
        code: 'STORAGE_NOT_CONFIGURED',
      });
    }

    return bucket;
  }

  assertSizeWithinLimit(purpose: DocumentPurpose, sizeBytes: number): void {
    const maxSize = PURPOSE_MAX_SIZE_BYTES[purpose];
    if (sizeBytes > maxSize) {
      throw new BadRequestException({
        error: `File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`,
        code: 'FILE_TOO_LARGE',
      });
    }
  }

  getPublicProfileUrl(storageKey: string): string | null {
    const baseUrl = this.configService.get<string>('r2.publicProfileUrl');

    if (!baseUrl?.trim()) {
      return null;
    }

    return buildPublicObjectUrl(baseUrl, storageKey);
  }
}
