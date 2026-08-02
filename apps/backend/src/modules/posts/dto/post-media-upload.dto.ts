import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  POST_MEDIA_MAX_SIZE_BYTES,
  POST_MEDIA_MIME_TYPES,
  UPLOADED_MEDIA_MAX_FILES,
  UPLOADED_MEDIA_MIN_FILES,
} from '../../../common/constants/media.constants';

export class InitPostMediaUploadFileDto {
  @ApiProperty({ example: 'hero.png' })
  @IsString()
  @MaxLength(200)
  filename!: string;

  @ApiProperty({ enum: POST_MEDIA_MIME_TYPES })
  @IsIn(POST_MEDIA_MIME_TYPES)
  mimeType!: (typeof POST_MEDIA_MIME_TYPES)[number];

  @ApiProperty({ example: 120_000, maximum: POST_MEDIA_MAX_SIZE_BYTES })
  @IsInt()
  @Min(1)
  @Max(POST_MEDIA_MAX_SIZE_BYTES)
  sizeBytes!: number;

  @ApiPropertyOptional({ example: 'Team offsite photo' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  @Max(UPLOADED_MEDIA_MAX_FILES - 1)
  sortOrder!: number;
}

export class InitPostMediaUploadDto {
  @ApiProperty({ type: [InitPostMediaUploadFileDto] })
  @IsArray()
  @ArrayMinSize(UPLOADED_MEDIA_MIN_FILES)
  @ArrayMaxSize(UPLOADED_MEDIA_MAX_FILES)
  @ValidateNested({ each: true })
  @Type(() => InitPostMediaUploadFileDto)
  files!: InitPostMediaUploadFileDto[];
}

export class ConfirmPostMediaUploadDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(UPLOADED_MEDIA_MIN_FILES)
  @ArrayMaxSize(UPLOADED_MEDIA_MAX_FILES)
  @IsUUID('4', { each: true })
  postMediaIds!: string[];

  @ApiPropertyOptional({
    description: 'Archive existing active media before activating uploads (default true)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
