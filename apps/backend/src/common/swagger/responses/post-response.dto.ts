import { ApiProperty } from '@nestjs/swagger';
import {
  PostPackageStatus,
  PostSource,
  PostType,
} from '@prisma/client';

export class PostVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  postPackageId!: string;

  @ApiProperty({ example: 1 })
  versionNumber!: number;

  @ApiProperty({ nullable: true })
  hook!: string | null;

  @ApiProperty({ nullable: true })
  body!: string | null;

  @ApiProperty({ nullable: true })
  cta!: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class PostPackageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  contentProfileId!: string | null;

  @ApiProperty({ example: 'I almost shut down my startup last year.' })
  hook!: string;

  @ApiProperty({ nullable: true })
  body!: string | null;

  @ApiProperty({ nullable: true })
  cta!: string | null;

  @ApiProperty({ type: [String], example: ['#startups'] })
  tags!: string[];

  @ApiProperty({ nullable: true })
  topic!: string | null;

  @ApiProperty({ enum: PostType, nullable: true })
  postType!: PostType | null;

  @ApiProperty({ nullable: true })
  tone!: string | null;

  @ApiProperty({ nullable: true })
  pillar!: string | null;

  @ApiProperty({ enum: PostSource })
  source!: PostSource;

  @ApiProperty({ enum: PostPackageStatus })
  status!: PostPackageStatus;

  @ApiProperty({ nullable: true, minimum: 0, maximum: 100 })
  score!: number | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  scheduledAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedForApprovalAt!: Date | null;

  @ApiProperty({ nullable: true })
  approvalFeedback!: string | null;

  @ApiProperty({ example: 1 })
  versionNumber!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class DeletePostResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
