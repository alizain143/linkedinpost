import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import {
  DocumentAttachedToType,
  DocumentPurpose,
} from '../../constants/document.constants';

export class InitUploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  documentId!: string;

  @ApiProperty({ description: 'Presigned URL for direct upload to R2' })
  uploadUrl!: string;
}

export class DocumentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: DocumentStatus })
  status!: DocumentStatus;

  @ApiProperty({ example: 'avatar.png' })
  filename!: string;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;

  @ApiProperty({ example: 102400 })
  sizeBytes!: number;

  @ApiProperty({ enum: DocumentPurpose })
  purpose!: DocumentPurpose;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  attachedAt!: Date | null;

  @ApiProperty({ enum: DocumentAttachedToType, nullable: true })
  attachedToType!: DocumentAttachedToType | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  attachedToId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ required: false })
  downloadUrl?: string;
}
