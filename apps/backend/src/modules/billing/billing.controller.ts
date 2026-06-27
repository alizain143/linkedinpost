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
  @ApiOperation({ summary: 'Create a Stripe Checkout session for a paid plan' })
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user, dto);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create a Stripe Customer Portal session' })
  createPortal(@CurrentUser() user: User) {
    return this.billingService.createPortalSession(user.id);
  }
}
