import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateImportTokenDto {
  @ApiPropertyOptional({
    description:
      'LinkedIn profile URL for this workspace (required on first import when OAuth did not store a vanity URL)',
    example: 'https://www.linkedin.com/in/jane-doe',
  })
  @IsOptional()
  @IsString()
  profileUrl?: string;
}
