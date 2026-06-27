import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestChangesDto {
  @ApiProperty({ example: 'Tone is too casual for this client' })
  @IsString()
  @IsNotEmpty()
  feedback!: string;
}

export class RejectPostDto {
  @ApiPropertyOptional({ example: 'Not aligned with current campaign' })
  @IsOptional()
  @IsString()
  feedback?: string;
}
