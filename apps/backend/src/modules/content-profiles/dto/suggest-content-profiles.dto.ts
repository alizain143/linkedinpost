import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContentGoal } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SuggestContentProfilesDto {
  @ApiPropertyOptional({ example: 'Co-founder & CEO' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  roleTitle?: string;

  @ApiPropertyOptional({ example: 'B2B SaaS' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  industry?: string;

  @ApiPropertyOptional({ example: 'Early-stage founders' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetAudience?: string;

  @ApiPropertyOptional({ enum: ContentGoal })
  @IsOptional()
  @IsEnum(ContentGoal)
  contentGoal?: ContentGoal;

  @ApiPropertyOptional({ example: 'LinkedIn growth platform for teams' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  offerDescription?: string;

  @ApiPropertyOptional({ example: 'Focus on thought leadership in AI ops' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
