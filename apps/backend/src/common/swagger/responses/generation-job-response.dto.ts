import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenerationJobStatus, GenerationJobType, PostType } from '@prisma/client';

export class QuickDraftVariantDto {
  @ApiProperty()
  hook!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  cta!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty({ enum: PostType })
  postType!: PostType;

  @ApiProperty()
  tone!: string;

  @ApiProperty()
  pillar!: string;
}

export class QuickDraftJobResultDto {
  @ApiProperty({ type: [QuickDraftVariantDto] })
  variants!: QuickDraftVariantDto[];
}

export class CouncilJobResultDto {
  @ApiProperty({ format: 'uuid' })
  postPackageId!: string;

  @ApiPropertyOptional({ example: 81 })
  finalScore!: number | null;

  @ApiProperty({ example: 1 })
  revisionCount!: number;

  @ApiProperty({ example: 0 })
  mediaRegenCount!: number;
}

export class CalendarJobResultSlotDto {
  @ApiProperty({ format: 'uuid' })
  postPackageId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scheduledAt!: string;

  @ApiProperty()
  topic!: string;

  @ApiProperty({ nullable: true })
  pillar!: string | null;
}

export class CalendarJobResultDto {
  @ApiProperty({ enum: [7, 30] })
  durationDays!: 7 | 30;

  @ApiProperty({ example: 7 })
  slotCount!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  postPackageIds!: string[];

  @ApiProperty({ type: [CalendarJobResultSlotDto] })
  slots!: CalendarJobResultSlotDto[];
}

export class GenerationJobProgressDto {
  @ApiProperty({ example: 'reviewer' })
  currentStep!: string;

  @ApiProperty({ example: 'Reviewer scoring draft' })
  currentLabel!: string;

  @ApiProperty({ example: 2 })
  completedSteps!: number;

  @ApiProperty({ example: 7 })
  totalSteps!: number;

  @ApiProperty({ example: 29 })
  percentComplete!: number;
}

export class CouncilEventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'writer' })
  agentRole!: string;

  @ApiProperty({ example: 1 })
  stepOrder!: number;

  @ApiProperty({ example: 1 })
  revisionAttempt!: number;

  @ApiProperty({ example: 'completed' })
  status!: string;

  @ApiProperty({ example: 'Writer created draft v1' })
  label!: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  output!: Record<string, unknown> | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  scores!: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 'gpt-5.4' })
  model!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt!: Date | null;

  @ApiPropertyOptional({ example: 4200 })
  durationMs!: number | null;
}

export class GenerationJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId!: string;

  @ApiProperty({ enum: GenerationJobType })
  type!: GenerationJobType;

  @ApiProperty({ enum: GenerationJobStatus })
  status!: GenerationJobStatus;

  @ApiProperty({ example: 'quick-draft' })
  flowId!: string;

  @ApiProperty({ example: 'v1' })
  promptVersion!: string;

  @ApiPropertyOptional({ example: 'gpt-5.4' })
  model!: string | null;

  @ApiProperty({ example: 1 })
  creditCost!: number;

  @ApiProperty({ example: true })
  creditCharged!: boolean;

  @ApiPropertyOptional()
  errorCode!: string | null;

  @ApiPropertyOptional()
  errorMessage!: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  postPackageId!: string | null;

  @ApiPropertyOptional({ type: GenerationJobProgressDto })
  progress!: GenerationJobProgressDto | null;

  @ApiPropertyOptional({ type: [CouncilEventDto] })
  events!: CouncilEventDto[] | null;

  @ApiPropertyOptional()
  result!: QuickDraftJobResultDto | CouncilJobResultDto | CalendarJobResultDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  completedAt!: Date | null;
}
