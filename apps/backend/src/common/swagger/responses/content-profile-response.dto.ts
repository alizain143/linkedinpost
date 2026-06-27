import { ApiProperty } from '@nestjs/swagger';
import { ContentGoal } from '@prisma/client';

export class ContentPillarResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Founder lessons' })
  name!: string;

  @ApiProperty({ example: 0 })
  sortOrder!: number;
}

export class ContentProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty({ example: 'Maya — Startup Founder' })
  name!: string;

  @ApiProperty({ example: 'Co-founder & CEO, Northbeam', nullable: true })
  roleTitle!: string | null;

  @ApiProperty({ example: 'B2B SaaS', nullable: true })
  industry!: string | null;

  @ApiProperty({
    example: 'Early-stage founders & operators',
    nullable: true,
  })
  targetAudience!: string | null;

  @ApiProperty({ enum: ContentGoal, example: ContentGoal.build_authority })
  contentGoal!: ContentGoal;

  @ApiProperty({ example: 'Bold & punchy', nullable: true })
  preferredTone!: string | null;

  @ApiProperty({ nullable: true })
  offerDescription!: string | null;

  @ApiProperty({ nullable: true })
  writingSample!: string | null;

  @ApiProperty({ example: 'leverage, synergy', nullable: true })
  avoidWords!: string | null;

  @ApiProperty({ example: true })
  isDefault!: boolean;

  @ApiProperty({ type: [ContentPillarResponseDto] })
  pillars!: ContentPillarResponseDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class DeleteContentProfileResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
