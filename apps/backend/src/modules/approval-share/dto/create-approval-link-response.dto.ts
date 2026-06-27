import { ApiProperty } from '@nestjs/swagger';

export class CreateApprovalLinkResponseDto {
  @ApiProperty({ example: 'http://localhost:3000/approve/abc123' })
  url!: string;

  @ApiProperty({ example: '2026-07-11T00:00:00.000Z' })
  expiresAt!: string;
}
