import { ApiPropertyOptional } from '@nestjs/swagger';
import { MediaMode } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class GenerateMediaRequestDto {
  @ApiPropertyOptional({
    example: 'Minimal dark layout with gold accent',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  mediaTemplateId?: string;
}
