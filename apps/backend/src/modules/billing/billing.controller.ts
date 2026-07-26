import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateCreditCheckoutDto } from './dto/create-credit-checkout.dto';
import { CreditQuoteQueryDto } from './dto/credit-quote-query.dto';
import { ListBillingTransactionsDto } from './dto/list-billing-transactions.dto';

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

  @Get('credits/quote')
  @ApiOperation({ summary: 'Quote a credit top-up purchase' })
  quoteCredits(@Query() query: CreditQuoteQueryDto) {
    return this.billingService.quoteCredits(query.credits);
  }

  @Post('credits/checkout')
  @ApiOperation({ summary: 'Create a Lemon Squeezy credit top-up checkout' })
  createCreditCheckout(
    @CurrentUser() user: User,
    @Body() dto: CreateCreditCheckoutDto,
  ) {
    return this.billingService.createCreditCheckoutSession(user, dto.credits);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List billing transactions for the current user' })
  listTransactions(
    @CurrentUser() user: User,
    @Query() query: ListBillingTransactionsDto,
  ) {
    return this.billingService.listTransactions(user.id, {
      limit: query.limit,
      cursor: query.cursor,
    });
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create a Lemon Squeezy subscription checkout' })
  createCheckout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    return this.billingService.createCheckoutSession(user, dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel the current subscription at period end' })
  cancelSubscription(@CurrentUser() user: User) {
    return this.billingService.cancelSubscription(user.id);
  }
}
