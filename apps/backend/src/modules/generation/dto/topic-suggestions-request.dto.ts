import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class TopicSuggestionsRequestDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentProfileId?: string;

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

  @ApiPropertyOptional({ example: 'Focus on lessons from Q1 hiring' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalContext?: string;
}
