import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceStatsDto {
  @ApiProperty({ example: 3 })
  draftCount!: number;

  @ApiProperty({ example: 2 })
  scheduledCount!: number;

  @ApiProperty({ example: true })
  hasDefaultProfile!: boolean;
}

export class WorkspaceDetailResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;

  @ApiProperty({ example: 'client' })
  type!: string;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: WorkspaceStatsDto })
  stats!: WorkspaceStatsDto;
}
