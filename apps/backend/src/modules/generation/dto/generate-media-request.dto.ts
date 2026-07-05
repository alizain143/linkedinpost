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
import { MEDIA_CUSTOM_PROMPT_MAX_LENGTH } from '../../../common/constants/media.constants';

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

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  mediaTemplateId?: string;
}
