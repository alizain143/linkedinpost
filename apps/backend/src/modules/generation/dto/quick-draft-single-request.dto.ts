import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuickDraftRequestDto } from './quick-draft-request.dto';

export class PreviousVariantDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  hook!: string;

  @ApiPropertyOptional()
  @IsString()
  body!: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  cta!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tags!: string[];
}

export class QuickDraftSingleRequestDto extends QuickDraftRequestDto {
  @ApiPropertyOptional({
    example: 'Make the hook more personal and shorten the body',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  revisionPrompt?: string;

  @ApiPropertyOptional({ type: PreviousVariantDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreviousVariantDto)
  previousVariant?: PreviousVariantDto;
}
