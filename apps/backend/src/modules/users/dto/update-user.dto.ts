import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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

  @ApiPropertyOptional({ type: UpdateNotificationPrefsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateNotificationPrefsDto)
  notifications?: UpdateNotificationPrefsDto;
}
