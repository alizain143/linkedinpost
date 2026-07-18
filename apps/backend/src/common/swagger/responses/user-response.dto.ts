import { ApiProperty } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';

export class UserNotificationPrefsDto {
  @ApiProperty({ example: true })
  weeklyReminders!: boolean;

  @ApiProperty({ example: true })
  generationComplete!: boolean;

  @ApiProperty({ example: false })
  productUpdates!: boolean;

  @ApiProperty({ example: true })
  publishAlerts!: boolean;

  @ApiProperty({ example: true })
  pushEnabled!: boolean;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'maya@example.com' })
  email!: string;

  @ApiProperty({ example: 'Maya', nullable: true })
  firstName!: string | null;

  @ApiProperty({ example: 'Reyes', nullable: true })
  lastName!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  profileDocumentId!: string | null;

  @ApiProperty({ nullable: true })
  profileImageUrl!: string | null;

  @ApiProperty({ example: 'America/New_York' })
  timezone!: string;

  @ApiProperty({ type: UserNotificationPrefsDto })
  notifications!: UserNotificationPrefsDto;

  @ApiProperty({ enum: UserPlan, example: UserPlan.free })
  plan!: UserPlan;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { 'product-core-v1': '2026-07-19T00:00:00.000Z' },
  })
  toursSeen!: Record<string, string>;

  @ApiProperty({ enum: UserPlan, nullable: true })
  lastAcknowledgedPlan!: UserPlan | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  defaultWorkspaceId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
