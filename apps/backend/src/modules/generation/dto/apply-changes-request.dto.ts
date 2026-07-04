import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyChangesRequestDto {
  @ApiPropertyOptional({
    example: 'Also make the CTA softer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalFeedback?: string;
}
