import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  @MaxLength(500)
  mediaCustomPrompt?: string;
}
