import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostPackageStatus, PostType } from '@prisma/client';

export class PublicApprovalMediaDto {
  @ApiProperty()
  url!: string;

  @ApiPropertyOptional()
  altText?: string | null;

  @ApiProperty({ example: 'image/png' })
  mimeType!: string;
}

export class PublicApprovalPreviewDto {
  @ApiProperty()
  hook!: string;

  @ApiPropertyOptional()
  body?: string | null;

  @ApiPropertyOptional()
  cta?: string | null;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiPropertyOptional()
  pillar?: string | null;

  @ApiPropertyOptional({ enum: PostType })
  postType?: PostType | null;

  @ApiProperty({ enum: PostPackageStatus })
  status!: PostPackageStatus;

  @ApiPropertyOptional()
  submittedForApprovalAt?: string | null;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty({ type: [PublicApprovalMediaDto] })
  media!: PublicApprovalMediaDto[];
}

export class PublicApprovalActionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: PostPackageStatus })
  status!: PostPackageStatus;

  @ApiPropertyOptional({
    description:
      'True when the workspace auto-applied AI revisions after request-changes',
  })
  autoApplyStarted?: boolean;
}
