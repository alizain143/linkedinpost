import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostPackageStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export enum CalendarView {
  month = 'month',
  week = 'week',
  list = 'list',
}

const DEFAULT_CALENDAR_STATUSES = [
  PostPackageStatus.ready_for_approval,
  PostPackageStatus.scheduled,
  PostPackageStatus.publishing,
  PostPackageStatus.published,
  PostPackageStatus.failed,
];

export class CalendarQueryDto {
  @ApiProperty({ enum: CalendarView, example: CalendarView.month })
  @IsEnum(CalendarView)
  view!: CalendarView;

  @ApiPropertyOptional({
    example: '2026-06-15',
    description: 'Anchor date (ISO date); defaults to today in user timezone',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    enum: PostPackageStatus,
    isArray: true,
    default: DEFAULT_CALENDAR_STATUSES,
    description: 'Filter by status (comma-separated)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return DEFAULT_CALENDAR_STATUSES;
    }
    if (Array.isArray(value)) {
      return value;
    }
    return String(value)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsEnum(PostPackageStatus, { each: true })
  status?: PostPackageStatus[];

  @ApiPropertyOptional({
    default: 50,
    minimum: 1,
    maximum: 100,
    description: 'Max items for list view',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
