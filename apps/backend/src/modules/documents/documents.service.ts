import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Document, DocumentStatus } from '@prisma/client';
import {
  DOCUMENT_PENDING_MAX_AGE_MS,
  DOCUMENT_PRESIGNED_URL_TTL_SECONDS,
  DocumentPurpose,
  PURPOSE_MIME_TYPES,
} from '../../common/constants/document.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { R2BucketService } from '../storage/r2-bucket.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { InitUploadDto } from './dto/init-upload.dto';

export interface DocumentResponse {
  id: string;
  status: DocumentStatus;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  purpose: DocumentPurpose;
  attachedAt: Date | null;
  createdAt: Date;
  downloadUrl?: string;
}

function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop()?.trim() ?? 'file';
  const cleaned = base.replace(/[^\w.\-() ]+/g, '_').slice(0, 200);
  return cleaned.length > 0 ? cleaned : 'file';
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2Storage: R2StorageService,
    private readonly r2BucketService: R2BucketService,
  ) {}

  private assertMimeAndSize(
    purpose: DocumentPurpose,
    mimeType: string,
    sizeBytes: number,
  ) {
    const allowedMimeTypes = PURPOSE_MIME_TYPES[purpose];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException({
        error: 'File type not allowed for this document purpose',
        code: 'FILE_TYPE_NOT_ALLOWED',
      });
    }

    this.r2BucketService.assertSizeWithinLimit(purpose, sizeBytes);
  }

  async initUpload(userId: string, dto: InitUploadDto) {
    this.assertMimeAndSize(dto.purpose, dto.mimeType, dto.sizeBytes);

    const pendingCount = await this.prisma.document.count({
      where: {
        userId,
        status: DocumentStatus.pending,
      },
    });

    if (pendingCount >= 10) {
      throw new BadRequestException({
        error: 'Too many pending uploads. Complete or cancel existing uploads first.',
        code: 'PENDING_UPLOAD_LIMIT',
      });
    }

    const filename = sanitizeFilename(dto.filename);
    const storageBucket = this.r2BucketService.resolveBucket(dto.purpose);
    const uploadExpiresAt = new Date(
      Date.now() + DOCUMENT_PRESIGNED_URL_TTL_SECONDS * 1000,
    );

    const saved = await this.prisma.document.create({
      data: {
        userId,
        status: DocumentStatus.pending,
        filename,
        mimeType: dto.mimeType,
        sizeBytes: BigInt(dto.sizeBytes),
        storageKey: '',
        storageBucket,
        purpose: dto.purpose,
        uploadExpiresAt,
      },
    });

    const storageKey = `${dto.purpose}/${userId}/${saved.id}/${filename}`;

    await this.prisma.document.update({
      where: { id: saved.id },
      data: { storageKey },
    });

    try {
      const uploadUrl = await this.r2Storage.createUploadUrl(
        storageBucket,
        storageKey,
        dto.mimeType,
        dto.sizeBytes,
      );

      return { documentId: saved.id, uploadUrl };
    } catch {
      await this.prisma.document.delete({ where: { id: saved.id } });
      throw new InternalServerErrorException({
        error: 'Failed to prepare upload',
        code: 'UPLOAD_INIT_FAILED',
      });
    }
  }

  async attachProfileDocument(params: {
    documentId: string;
    userId: string;
  }): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: { id: params.documentId, userId: params.userId },
    });

    if (!document) {
      throw new NotFoundException({
        error: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND',
      });
    }

    if (document.purpose !== DocumentPurpose.PROFILE) {
      throw new BadRequestException({
        error: 'Document purpose must be profile for this attachment',
        code: 'DOCUMENT_PURPOSE_MISMATCH',
      });
    }

    if (document.status === DocumentStatus.attached) {
      return document;
    }

    if (document.uploadExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException({
        error: 'Upload window expired',
        code: 'UPLOAD_EXPIRED',
      });
    }

    try {
      await this.r2Storage.verifyUploadedObject(
        document.storageBucket,
        document.storageKey,
        document.mimeType,
        Number(document.sizeBytes),
      );
    } catch {
      throw new BadRequestException({
        error: 'Uploaded file could not be verified',
        code: 'UPLOAD_VERIFICATION_FAILED',
      });
    }

    return this.prisma.document.update({
      where: { id: document.id },
      data: {
        status: DocumentStatus.attached,
        attachedAt: new Date(),
      },
    });
  }

  async getDocumentForUser(
    documentId: string,
    userId: string,
    includeDownloadUrl = false,
  ): Promise<DocumentResponse> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new NotFoundException({
        error: 'Document not found',
        code: 'DOCUMENT_NOT_FOUND',
      });
    }

    return this.toResponse(document, includeDownloadUrl);
  }

  async getProfileImageUrl(documentId: string): Promise<string | null> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (
      !document ||
      document.status !== DocumentStatus.attached ||
      document.purpose !== DocumentPurpose.PROFILE
    ) {
      return null;
    }

    return this.r2BucketService.getPublicProfileUrl(document.storageKey);
  }

  async removeDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      return;
    }

    try {
      await this.r2Storage.deleteObject(
        document.storageBucket,
        document.storageKey,
      );
    } catch {
      // Best-effort R2 cleanup.
    }

    await this.prisma.document.delete({ where: { id: document.id } });
  }

  async purgeStalePendingDocuments(): Promise<number> {
    const cutoff = new Date(Date.now() - DOCUMENT_PENDING_MAX_AGE_MS);
    const stale = await this.prisma.document.findMany({
      where: {
        status: DocumentStatus.pending,
        createdAt: { lt: cutoff },
      },
    });

    for (const document of stale) {
      try {
        await this.r2Storage.deleteObject(
          document.storageBucket,
          document.storageKey,
        );
      } catch {
        // Continue cleanup even if object was never uploaded.
      }
      await this.prisma.document.delete({ where: { id: document.id } });
    }

    return stale.length;
  }

  private async toResponse(
    document: Document,
    includeDownloadUrl: boolean,
  ): Promise<DocumentResponse> {
    const response: DocumentResponse = {
      id: document.id,
      status: document.status,
      filename: document.filename,
      mimeType: document.mimeType,
      sizeBytes: Number(document.sizeBytes),
      purpose: document.purpose as DocumentPurpose,
      attachedAt: document.attachedAt,
      createdAt: document.createdAt,
    };

    if (includeDownloadUrl && document.status === DocumentStatus.attached) {
      response.downloadUrl =
        this.r2BucketService.getPublicProfileUrl(document.storageKey) ??
        undefined;
    }

    return response;
  }
}
