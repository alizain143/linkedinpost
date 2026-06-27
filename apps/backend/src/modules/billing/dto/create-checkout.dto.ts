import { ApiProperty } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';
import { IsEnum } from 'class-validator';

const CHECKOUT_PLANS = [UserPlan.starter, UserPlan.pro, UserPlan.agency] as const;

export class CreateCheckoutDto {
  @ApiProperty({ enum: CHECKOUT_PLANS, example: UserPlan.pro })
  @IsEnum(CHECKOUT_PLANS)
  plan!: (typeof CHECKOUT_PLANS)[number];
}
