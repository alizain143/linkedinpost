import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ImportPositionDateDto {
  @ApiPropertyOptional()
  @IsOptional()
  month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  year?: number;
}

class ImportPositionDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  companyName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  companyPageUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, type: ImportPositionDateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImportPositionDateDto)
  startedOn?: ImportPositionDateDto | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

class ImportEducationDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  schoolName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  degreeName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string | null;
}

export class ImportLinkedInProfileDto {
  @ApiProperty({ example: 'https://www.linkedin.com/in/jane-doe' })
  @IsString()
  @IsNotEmpty()
  profileUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  headline?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'About section text' })
  @IsOptional()
  @IsString()
  summary?: string | null;

  @ApiPropertyOptional({
    description: 'Free-text experience lines (paste fallback)',
  })
  @IsOptional()
  @IsString()
  experienceText?: string;

  @ApiPropertyOptional({ type: [ImportPositionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPositionDto)
  positions?: ImportPositionDto[];

  @ApiPropertyOptional({ type: [ImportEducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportEducationDto)
  education?: ImportEducationDto[];

  @ApiPropertyOptional({
    description: 'Short-lived token from POST .../profile/import-token (extension flow)',
  })
  @IsOptional()
  @IsString()
  importToken?: string;
}

export class ImportTokenResponseDto {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty({
    description: 'Suggested LinkedIn URL with token query param for extension',
  })
  linkedInImportUrl!: string;

  @ApiProperty({
    description: 'Vanity slug of the workspace connected LinkedIn profile',
  })
  expectedProfileSlug!: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Display name of the connected LinkedIn profile',
  })
  profileName?: string | null;
}
