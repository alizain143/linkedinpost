import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'I almost shut down my startup last year.' })
  @IsString()
  @MaxLength(500)
  hook!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: "What's the boldest bet you've made?" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cta?: string;

  @ApiPropertyOptional({ example: ['#startups', '#founders'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Founder lesson on focus' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  topic?: string;

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
}
