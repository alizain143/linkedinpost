import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DOCUMENT_PRESIGNED_URL_TTL_SECONDS } from '../../common/constants/document.constants';

@Injectable()
export class R2StorageService {
  private client: S3Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    const accountId = this.configService.get<string>('r2.accountId');
    const accessKeyId = this.configService.get<string>('r2.accessKeyId');
    const secretAccessKey = this.configService.get<string>(
      'r2.secretAccessKey',
    );

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 storage is not configured');
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    return this.client;
  }

  async createUploadUrl(
    bucketName: string,
    storageKey: string,
    mimeType: string,
    sizeBytes: number,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      ContentType: mimeType,
      ContentLength: sizeBytes,
    });

    return getSignedUrl(this.getClient(), command, {
      expiresIn: DOCUMENT_PRESIGNED_URL_TTL_SECONDS,
    });
  }

  async createDownloadUrl(
    bucketName: string,
    storageKey: string,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    });

    return getSignedUrl(this.getClient(), command, {
      expiresIn: DOCUMENT_PRESIGNED_URL_TTL_SECONDS,
    });
  }

  async verifyUploadedObject(
    bucketName: string,
    storageKey: string,
    expectedMimeType: string,
    expectedSizeBytes: number,
  ): Promise<void> {
    const head = await this.getClient().send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      }),
    );

    if (!head.ContentLength || head.ContentLength !== expectedSizeBytes) {
      throw new Error('Uploaded file size mismatch');
    }

    const contentType = head.ContentType?.split(';')[0]?.trim();
    if (!contentType) {
      throw new Error('Uploaded file type missing');
    }

    if (contentType !== expectedMimeType) {
      throw new Error('Uploaded file type mismatch');
    }
  }

  async deleteObject(bucketName: string, storageKey: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      }),
    );
  }

  async putObject(
    bucketName: string,
    storageKey: string,
    body: Buffer,
    mimeType: string,
  ): Promise<void> {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
        Body: body,
        ContentType: mimeType,
        ContentLength: body.length,
      }),
    );
  }

  async getObjectBuffer(
    bucketName: string,
    storageKey: string,
  ): Promise<Buffer> {
    const response = await this.getClient().send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: storageKey,
      }),
    );

    if (!response.Body) {
      throw new Error('R2 object body is empty');
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}
