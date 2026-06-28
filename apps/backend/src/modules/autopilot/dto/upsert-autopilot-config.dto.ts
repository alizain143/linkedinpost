import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
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

const APPROVAL_MODES = ['require_approval', 'auto_schedule'] as const;

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
    description: 'ISO weekday (1–7) → content profile UUID overrides',
    example: { '1': 'uuid', '3': 'uuid' },
  })
  @IsOptional()
  @IsObject()
  dayProfileOverrides?: Record<string, string>;

  @ApiPropertyOptional({
    enum: APPROVAL_MODES,
    example: 'require_approval',
  })
  @IsOptional()
  @IsIn(APPROVAL_MODES)
  approvalMode?: (typeof APPROVAL_MODES)[number];

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
