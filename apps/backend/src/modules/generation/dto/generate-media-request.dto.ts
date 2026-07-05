import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaFormat, MediaMode } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsMediaTemplateId } from '../../../common/validators/media-template-id.validator';
import {
  CAROUSEL_MAX_SLIDES,
  CAROUSEL_MIN_SLIDES,
  MEDIA_CUSTOM_PROMPT_MAX_LENGTH,
} from '../../../common/constants/media.constants';

export class GenerateMediaRequestDto {
  @ApiPropertyOptional({
    example: 'Minimal dark layout with gold accent',
    maxLength: MEDIA_CUSTOM_PROMPT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MEDIA_CUSTOM_PROMPT_MAX_LENGTH)
  mediaCustomPrompt?: string;

  @ApiPropertyOptional({
    description: 'Replace existing media on the post',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  @ApiPropertyOptional({ enum: MediaMode })
  @IsOptional()
  @IsEnum(MediaMode)
  mediaMode?: MediaMode;

  @ApiPropertyOptional({ enum: MediaFormat, default: MediaFormat.single })
  @IsOptional()
  @IsEnum(MediaFormat)
  mediaFormat?: MediaFormat;

  @ApiPropertyOptional({
    description: 'Total carousel slides when mediaFormat is carousel; omit for AI auto',
    minimum: CAROUSEL_MIN_SLIDES,
    maximum: CAROUSEL_MAX_SLIDES,
  })
  @IsOptional()
  @IsInt()
  @Min(CAROUSEL_MIN_SLIDES)
  @Max(CAROUSEL_MAX_SLIDES)
  carouselSlideCount?: number;

  @ApiPropertyOptional({
    description: 'Workspace template UUID or system preset id (e.g. system:carousel-identity)',
  })
  @IsOptional()
  @IsMediaTemplateId()
  mediaTemplateId?: string;
}
