import { ApiPropertyOptional } from '@nestjs/swagger';
import { AutopilotFrequency } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpsertAutopilotConfigDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contentProfileId?: string;

  @ApiPropertyOptional({ enum: AutopilotFrequency, example: AutopilotFrequency.three_per_week })
  @IsOptional()
  @IsEnum(AutopilotFrequency)
  frequency?: AutopilotFrequency;

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
