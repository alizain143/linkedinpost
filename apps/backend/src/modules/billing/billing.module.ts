import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingSyncService } from './billing-sync.service';
import { PlanFeatureService } from './plan-feature.service';
import { StripeClientService } from './stripe-client.service';
import { StripeCustomerService } from './stripe-customer.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    StripeClientService,
    StripeCustomerService,
    BillingService,
    BillingSyncService,
    StripeWebhookService,
    PlanFeatureService,
  ],
  exports: [PlanFeatureService, BillingSyncService],
})
export class BillingModule {}
