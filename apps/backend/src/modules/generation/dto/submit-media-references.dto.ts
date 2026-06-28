import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostMediaType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class SubmitMediaReferencesDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(3)
  selectedUrls!: string[];

  @ApiPropertyOptional({ enum: PostMediaType })
  @IsOptional()
  @IsEnum(PostMediaType)
  mediaType?: PostMediaType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mediaCustomPrompt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mediaTemplateId?: string;
}
