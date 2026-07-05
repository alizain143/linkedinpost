import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CalendarGenerateRequestDto {
  @ApiProperty({ enum: [7, 30], example: 7 })
  @IsIn([7, 30])
  durationDays!: 7 | 30;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentProfileId?: string;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'ISO date YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  postingTime?: string;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    description: 'ISO weekdays 1=Mon … 7=Sun',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  postingDays?: number[];

  @ApiPropertyOptional({
    example: 'Focus on founder lessons and shipping weekly',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalContext?: string;

  @ApiPropertyOptional({
    enum: ['quick_draft', 'council'],
    default: 'quick_draft',
    description: 'Per-slot generation mode: text-only quick draft or AI council with image',
  })
  @IsOptional()
  @IsIn(['quick_draft', 'council'])
  slotGenerationMode?: 'quick_draft' | 'council';
}
