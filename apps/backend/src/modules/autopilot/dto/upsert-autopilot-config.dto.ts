import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import type { AutopilotPostingPreset } from '../autopilot-schedule.util';

const POSTING_PRESETS: AutopilotPostingPreset[] = [
  'three_per_week',
  'daily',
  'weekdays',
  'weekly',
];

export class UpsertAutopilotConfigDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentProfileId?: string;

  @ApiPropertyOptional({
    enum: POSTING_PRESETS,
    example: 'three_per_week',
    description:
      'Optional preset; expands to postingDays when postingDays omitted',
  })
  @IsOptional()
  @IsIn(POSTING_PRESETS)
  postingPreset?: AutopilotPostingPreset;

  @ApiPropertyOptional({
    example: [1, 3, 4, 5, 7],
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

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  postingTime?: string;
}
