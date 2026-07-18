import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UpdateNotificationPrefsDto } from './update-notification-prefs.dto';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Maya', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Reyes', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Attach a profile image document from POST /documents/init',
  })
  @IsOptional()
  @IsUUID()
  profileDocumentId?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  @ApiPropertyOptional({ type: () => UpdateNotificationPrefsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateNotificationPrefsDto)
  notifications?: UpdateNotificationPrefsDto;

  @ApiPropertyOptional({
    description: 'Tour id to mark as seen (merged into toursSeen)',
    example: 'product-core-v1',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  markTourSeen?: string;

  @ApiPropertyOptional({
    enum: UserPlan,
    description: 'Plan the user has acknowledged for unlock walkthroughs',
  })
  @IsOptional()
  @IsEnum(UserPlan)
  lastAcknowledgedPlan?: UserPlan;
}
