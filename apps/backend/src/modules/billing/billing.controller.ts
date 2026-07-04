import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('billing')
@ApiBearerAuth('bearer')
@Controller('billing')
@UseGuards(ClerkAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current plan and subscription status' })
  getBilling(@CurrentUser() user: User) {
    return this.billingService.getBillingStatus(user.id);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create an XPay subscription checkout session' })
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user, dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel the current XPay subscription' })
  cancelSubscription(@CurrentUser() user: User) {
    return this.billingService.cancelSubscription(user.id);
  }
}
