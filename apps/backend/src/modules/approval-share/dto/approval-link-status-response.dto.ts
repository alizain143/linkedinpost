import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovalLinkStatusResponseDto {
  @ApiProperty({ example: true })
  active!: boolean;

  @ApiPropertyOptional({ example: '2026-07-11T00:00:00.000Z' })
  expiresAt?: string;

  @ApiPropertyOptional({ example: '2026-06-27T00:00:00.000Z' })
  createdAt?: string;
}
