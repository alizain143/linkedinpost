import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentGoal } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateContentProfileDto {
  @ApiPropertyOptional({ example: 'Maya — Startup Founder', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Co-founder & CEO, Northbeam', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  roleTitle?: string;

  @ApiPropertyOptional({ example: 'B2B SaaS', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  industry?: string;

  @ApiPropertyOptional({
    example: 'Early-stage founders & operators',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetAudience?: string;

  @ApiPropertyOptional({
    enum: ContentGoal,
    example: ContentGoal.build_authority,
  })
  @IsOptional()
  @IsEnum(ContentGoal)
  contentGoal?: ContentGoal;

  @ApiPropertyOptional({ example: 'Bold & punchy', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferredTone?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  offerDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  writingSample?: string;

  @ApiPropertyOptional({ example: 'leverage, synergy', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  avoidWords?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: ['Founder lessons', 'Industry takes'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  pillars?: string[];
}
