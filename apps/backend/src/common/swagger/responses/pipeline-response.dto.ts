import { ApiProperty } from '@nestjs/swagger';
import {
  PostPackageStatus,
  PostSource,
  PostType,
} from '@prisma/client';

export class PostPackageSummaryDto {
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
  scheduledAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class PipelineColumnDto {
  @ApiProperty({ enum: PostPackageStatus })
  status!: PostPackageStatus;

  @ApiProperty({ example: 'Draft' })
  label!: string;

  @ApiProperty({ example: 3 })
  count!: number;

  @ApiProperty({ type: [PostPackageSummaryDto] })
  posts!: PostPackageSummaryDto[];
}

export class PipelineResponseDto {
  @ApiProperty({ type: [PipelineColumnDto] })
  columns!: PipelineColumnDto[];
}
