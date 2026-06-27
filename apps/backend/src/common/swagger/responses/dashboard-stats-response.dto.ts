import { ApiProperty } from '@nestjs/swagger';
import { PostType, UserPlan } from '@prisma/client';

export class DashboardCreditsDto {
  @ApiProperty({ example: 0 })
  used!: number;

  @ApiProperty({ example: 200 })
  limit!: number;

  @ApiProperty({ example: 0 })
  percentUsed!: number;
}

export class DashboardCountsDto {
  @ApiProperty({ example: 12 })
  drafts!: number;

  @ApiProperty({ example: 7 })
  scheduled!: number;

  @ApiProperty({ example: 5 })
  publishedThisMonth!: number;

  @ApiProperty({ example: 0 })
  generatedThisMonth!: number;
}

export class DashboardNextScheduledDto {
  @ApiProperty({ format: 'uuid' })
  postId!: string;

  @ApiProperty()
  hook!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: Date;
}

export class DashboardRecentDraftDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  hook!: string;

  @ApiProperty({ nullable: true })
  preview!: string | null;

  @ApiProperty({ enum: PostType, nullable: true })
  postType!: PostType | null;

  @ApiProperty({ nullable: true })
  tone!: string | null;

  @ApiProperty({ nullable: true })
  pillar!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ enum: UserPlan, example: UserPlan.pro })
  plan!: UserPlan;

  @ApiProperty({ type: DashboardCreditsDto })
  credits!: DashboardCreditsDto;

  @ApiProperty({ type: DashboardCountsDto })
  counts!: DashboardCountsDto;

  @ApiProperty({ type: DashboardNextScheduledDto, nullable: true })
  nextScheduled!: DashboardNextScheduledDto | null;

  @ApiProperty({ type: [DashboardRecentDraftDto] })
  recentDrafts!: DashboardRecentDraftDto[];
}
