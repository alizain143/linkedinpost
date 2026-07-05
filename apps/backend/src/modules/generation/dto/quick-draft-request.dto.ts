import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaFormat, MediaMode, PostType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
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

export class QuickDraftRequestDto {
  @ApiProperty({ example: 'Shipping weekly as a founder' })
  @IsString()
  @MaxLength(500)
  topic!: string;

  @ApiPropertyOptional({ enum: PostType, example: PostType.personal_story })
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @ApiPropertyOptional({ example: 'Bold & punchy' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tone?: string;

  @ApiPropertyOptional({ example: 'Founder lessons' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  pillar?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentProfileId?: string;

  @ApiPropertyOptional({ example: 'Focus on consistency over perfection' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalContext?: string;

  @ApiPropertyOptional({ example: 'Minimal dark background with gold accents' })
  @IsOptional()
  @IsString()
  @MaxLength(MEDIA_CUSTOM_PROMPT_MAX_LENGTH)
  mediaCustomPrompt?: string;

  @ApiPropertyOptional({ enum: MediaMode })
  @IsOptional()
  @IsEnum(MediaMode)
  mediaMode?: MediaMode;

  @ApiPropertyOptional({ enum: MediaFormat, default: MediaFormat.single })
  @IsOptional()
  @IsEnum(MediaFormat)
  mediaFormat?: MediaFormat;

  @ApiPropertyOptional({
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
