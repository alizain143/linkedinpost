import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostMediaType, PostType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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

  @ApiPropertyOptional({ enum: PostMediaType })
  @IsOptional()
  @IsEnum(PostMediaType)
  mediaType?: PostMediaType;

  @ApiPropertyOptional({ example: 'Minimal dark background with gold accents' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mediaCustomPrompt?: string;

  @ApiPropertyOptional({ example: 'classic' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mediaTemplateId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  skipImageScout?: boolean;
}
