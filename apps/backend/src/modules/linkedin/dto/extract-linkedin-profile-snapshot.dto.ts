import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExtractLinkedInProfileSnapshotDto {
  @ApiProperty({ example: 'https://www.linkedin.com/in/jane-doe' })
  @IsString()
  @IsNotEmpty()
  profileUrl!: string;

  @ApiProperty({
    description: 'Visible page text from the profile main area',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120_000)
  pageText!: string;

  @ApiPropertyOptional({
    description: 'Sanitized innerHTML of main profile area (optional if pageText is present)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(600_000)
  mainHtml?: string | null;

  @ApiProperty({
    description: 'Short-lived token from POST .../profile/import-token',
  })
  @IsString()
  @IsNotEmpty()
  importToken!: string;
}

export class ExtractedLinkedInProfilePreviewDto {
  @ApiProperty()
  profileUrl!: string;

  @ApiPropertyOptional({ nullable: true })
  headline?: string | null;

  @ApiPropertyOptional({ nullable: true })
  summary?: string | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  positions?: Array<{
    title?: string | null;
    companyName?: string | null;
    description?: string | null;
    isCurrent?: boolean;
  }>;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  education?: Array<{
    schoolName?: string | null;
    degreeName?: string | null;
  }>;

  @ApiPropertyOptional({ type: [String] })
  skills?: string[];
}
