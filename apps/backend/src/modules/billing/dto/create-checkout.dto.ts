import { ApiProperty } from '@nestjs/swagger';
import { UserPlan } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

const CHECKOUT_PLANS = [
  UserPlan.starter,
  UserPlan.pro,
  UserPlan.agency,
] as const;

/** E.164: + followed by 8–15 digits */
const E164_PHONE = /^\+[1-9]\d{7,14}$/;

export class CreateCheckoutDto {
  @ApiProperty({ enum: CHECKOUT_PLANS, example: UserPlan.pro })
  @IsEnum(CHECKOUT_PLANS)
  plan!: (typeof CHECKOUT_PLANS)[number];

  @ApiProperty({
    example: '+923001234567',
    description: 'Customer phone in E.164 format (required by XPay)',
  })
  @IsString()
  @Matches(E164_PHONE, {
    message: 'phone must be a valid E.164 number (e.g. +923001234567)',
  })
  phone!: string;
}
