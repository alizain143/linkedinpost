import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceType } from '@prisma/client';

export class WorkspaceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: "Maya's Workspace" })
  name!: string;

  @ApiProperty({ enum: WorkspaceType, example: WorkspaceType.personal })
  type!: WorkspaceType;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
