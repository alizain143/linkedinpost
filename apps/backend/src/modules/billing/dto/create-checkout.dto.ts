import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import {
  NEW_CHECKOUT_PLANS,
  type NewCheckoutPlan,
} from '../../../common/constants/checkout-plans';

export class CreateCheckoutDto {
  @ApiProperty({ enum: NEW_CHECKOUT_PLANS, example: NEW_CHECKOUT_PLANS[0] })
  @IsEnum(NEW_CHECKOUT_PLANS)
  plan!: NewCheckoutPlan;
}
