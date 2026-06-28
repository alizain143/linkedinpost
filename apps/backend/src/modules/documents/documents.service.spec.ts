import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentStatus } from '@prisma/client';
import { DocumentPurpose } from '../../common/constants/document.constants';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { R2BucketService } from '../storage/r2-bucket.service';
import { R2StorageService } from '../storage/r2-storage.service';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const prisma = createMockPrismaService() as ReturnType<
    typeof createMockPrismaService
  > & {
    document: {
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  prisma.document = {
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };

  const r2Storage = {
    createPresignedUpload: jest.fn(),
    verifyUploadedObject: jest.fn(),
    createPresignedDownload: jest.fn(),
  };
  const r2BucketService = {
    resolveBucket: jest.fn().mockReturnValue('bucket'),
    assertSizeWithinLimit: jest.fn(),
    buildStorageKey: jest.fn().mockReturnValue('key'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: R2StorageService, useValue: r2Storage },
        { provide: R2BucketService, useValue: r2BucketService },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  it('rejects init when pending upload cap is reached', async () => {
    prisma.document.count.mockResolvedValue(10);

    await expect(
      service.initUpload(userId, {
        filename: 'avatar.png',
        mimeType: 'image/png',
        sizeBytes: 1024,
        purpose: DocumentPurpose.PROFILE,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PENDING_UPLOAD_LIMIT' }),
    });
  });

  it('fails profile attach when R2 verification fails', async () => {
    const document = {
      id: 'doc-1',
      userId,
      purpose: DocumentPurpose.PROFILE,
      status: DocumentStatus.pending,
      uploadExpiresAt: new Date(Date.now() + 60_000),
      storageBucket: 'bucket',
      storageKey: 'key',
      mimeType: 'image/png',
      sizeBytes: BigInt(1024),
    };
    prisma.document.findFirst.mockResolvedValue(document);
    r2Storage.verifyUploadedObject.mockRejectedValue(new Error('missing content-type'));

    await expect(
      service.attachProfileDocument({ userId, documentId: 'doc-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
