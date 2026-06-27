import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class SchedulePostDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-07-15T14:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;
}
