import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import {
  CREDIT_TOPUP_MAX,
  CREDIT_TOPUP_MIN,
} from '../../../common/constants/credit-topup.pricing';

export class CreateCreditCheckoutDto {
  @ApiProperty({ example: 150, minimum: CREDIT_TOPUP_MIN, maximum: CREDIT_TOPUP_MAX })
  @Type(() => Number)
  @IsInt()
  @Min(CREDIT_TOPUP_MIN)
  @Max(CREDIT_TOPUP_MAX)
  credits!: number;
}
