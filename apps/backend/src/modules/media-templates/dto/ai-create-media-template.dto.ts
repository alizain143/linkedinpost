import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AiTemplateReferenceFileDto } from './ai-template-reference-file.dto';

export class AiCreateMediaTemplateDto {
  @ApiPropertyOptional({
    example:
      'Minimal white card, avatar and name top left, title top right, skills bottom left, Save & Repost bottom right, big headline center',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prompt?: string;

  @ApiPropertyOptional({
    description: 'Optional image or PDF used as a visual layout reference',
    type: AiTemplateReferenceFileDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AiTemplateReferenceFileDto)
  referenceFile?: AiTemplateReferenceFileDto;
}
