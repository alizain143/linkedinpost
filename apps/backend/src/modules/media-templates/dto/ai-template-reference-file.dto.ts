import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const AI_TEMPLATE_REFERENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

export type AiTemplateReferenceMimeType =
  (typeof AI_TEMPLATE_REFERENCE_MIME_TYPES)[number];

export class AiTemplateReferenceFileDto {
  @ApiProperty({ enum: AI_TEMPLATE_REFERENCE_MIME_TYPES, example: 'image/png' })
  @IsString()
  @IsIn([...AI_TEMPLATE_REFERENCE_MIME_TYPES])
  mimeType!: AiTemplateReferenceMimeType;

  @ApiProperty({ description: 'Base64-encoded file bytes (no data: URL prefix)' })
  @IsString()
  @MaxLength(9_000_000)
  data!: string;

  @ApiPropertyOptional({ example: 'carousel-reference.png' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}
