import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class PreviewMediaTemplateDto {
  @ApiPropertyOptional({ description: 'Layout override; uses saved layout if omitted' })
  @IsOptional()
  @IsObject()
  layout?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headlineHighlight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subhead?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  profileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  roleTitle?: string;

  @ApiPropertyOptional({ enum: ['first', 'middle', 'last'] })
  @IsOptional()
  @IsIn(['first', 'middle', 'last'])
  pageRole?: 'first' | 'middle' | 'last';
}
