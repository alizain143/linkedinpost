import { ApiProperty } from '@nestjs/swagger';
import {
  PostPackageStatus,
  PostType,
} from '@prisma/client';

export class CalendarEventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  hook!: string;

  @ApiProperty({ nullable: true })
  pillar!: string | null;

  @ApiProperty({ enum: PostPackageStatus })
  status!: PostPackageStatus;

  @ApiProperty({ enum: PostType, nullable: true })
  postType!: PostType | null;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: Date;
}

export class CalendarMonthCellDto {
  @ApiProperty({ example: '2026-06-27' })
  date!: string;

  @ApiProperty({ example: 27 })
  day!: number;

  @ApiProperty()
  inMonth!: boolean;

  @ApiProperty()
  isToday!: boolean;

  @ApiProperty({ type: [CalendarEventDto] })
  posts!: CalendarEventDto[];
}

export class CalendarMonthResponseDto {
  @ApiProperty({ example: 'month' })
  view!: 'month';

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 6 })
  month!: number;

  @ApiProperty({ example: 'America/New_York' })
  timezone!: string;

  @ApiProperty({ type: [CalendarMonthCellDto] })
  cells!: CalendarMonthCellDto[];
}

export class CalendarWeekDayDto {
  @ApiProperty({ example: '2026-06-23' })
  date!: string;

  @ApiProperty({ example: 'MON' })
  dayOfWeek!: string;

  @ApiProperty({ example: 23 })
  day!: number;

  @ApiProperty({ type: [CalendarEventDto] })
  posts!: CalendarEventDto[];
}

export class CalendarWeekResponseDto {
  @ApiProperty({ example: 'week' })
  view!: 'week';

  @ApiProperty({ example: '2026-06-23' })
  startDate!: string;

  @ApiProperty({ example: '2026-06-29' })
  endDate!: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone!: string;

  @ApiProperty({ type: [CalendarWeekDayDto] })
  days!: CalendarWeekDayDto[];
}

export class CalendarListResponseDto {
  @ApiProperty({ example: 'list' })
  view!: 'list';

  @ApiProperty({ example: 'America/New_York' })
  timezone!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  rangeStart!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  rangeEnd!: Date;

  @ApiProperty({ type: [CalendarEventDto] })
  items!: CalendarEventDto[];
}

export class CalendarResponseDto {
  @ApiProperty({ enum: ['month', 'week', 'list'] })
  view!: 'month' | 'week' | 'list';

  @ApiProperty({ required: false, example: 2026 })
  year?: number;

  @ApiProperty({ required: false, example: 6 })
  month?: number;

  @ApiProperty({ required: false, example: '2026-06-23' })
  startDate?: string;

  @ApiProperty({ required: false, example: '2026-06-29' })
  endDate?: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone!: string;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  rangeStart?: Date;

  @ApiProperty({ required: false, type: String, format: 'date-time' })
  rangeEnd?: Date;

  @ApiProperty({ required: false, type: [CalendarMonthCellDto] })
  cells?: CalendarMonthCellDto[];

  @ApiProperty({ required: false, type: [CalendarWeekDayDto] })
  days?: CalendarWeekDayDto[];

  @ApiProperty({ required: false, type: [CalendarEventDto] })
  items?: CalendarEventDto[];
}
