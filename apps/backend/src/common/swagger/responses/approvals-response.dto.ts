import { ApiProperty } from '@nestjs/swagger';
import {
  PostPackageStatus,
  PostSource,
  PostType,
} from '@prisma/client';
import { ApprovalTab } from '../../../modules/approvals/approvals.constants';

export class ApprovalQueueItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  hook!: string;

  @ApiProperty({ nullable: true })
  pillar!: string | null;

  @ApiProperty({ enum: PostType, nullable: true })
  postType!: PostType | null;

  @ApiProperty({ enum: PostSource })
  source!: PostSource;

  @ApiProperty({ enum: PostPackageStatus })
  status!: PostPackageStatus;

  @ApiProperty({ nullable: true })
  score!: number | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedForApprovalAt!: Date | null;

  @ApiProperty({ nullable: true })
  approvalFeedback!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;
}

export class ApprovalTabCountsDto {
  @ApiProperty({ example: 2 })
  mine!: number;

  @ApiProperty({ example: 0 })
  client!: number;

  @ApiProperty({ example: 1 })
  changes!: number;

  @ApiProperty({ example: 4 })
  approved!: number;
}

export class ApprovalsResponseDto {
  @ApiProperty({ enum: ApprovalTab, example: ApprovalTab.mine })
  tab!: ApprovalTab;

  @ApiProperty({ type: ApprovalTabCountsDto })
  counts!: ApprovalTabCountsDto;

  @ApiProperty({ type: [ApprovalQueueItemDto] })
  items!: ApprovalQueueItemDto[];
}
