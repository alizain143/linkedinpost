import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostPackageStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

export class TransitionPostStatusDto {
  @ApiProperty({ enum: PostPackageStatus, example: PostPackageStatus.scheduled })
  @IsEnum(PostPackageStatus)
  status!: PostPackageStatus;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Required when status is scheduled',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;
}
