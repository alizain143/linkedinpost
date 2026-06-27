import { ApiProperty } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';

export class CreditsBalanceResponseDto {
  @ApiProperty({ enum: UserPlan, example: UserPlan.pro })
  plan!: UserPlan;

  @ApiProperty({ type: String, format: 'date-time' })
  periodStart!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  periodEnd!: Date;

  @ApiProperty({ example: 0 })
  used!: number;

  @ApiProperty({ example: 200 })
  limit!: number;

  @ApiProperty({ example: 200 })
  remaining!: number;

  @ApiProperty({ example: 0 })
  percentUsed!: number;
}
