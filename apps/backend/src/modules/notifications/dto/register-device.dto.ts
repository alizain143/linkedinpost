import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM registration token' })
  @IsString()
  @MinLength(10)
  @MaxLength(4096)
  token!: string;

  @ApiPropertyOptional({ description: 'Browser user agent string' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;
}
