import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingSyncService } from './billing-sync.service';
import { BillingTransactionService } from './billing-transaction.service';
import { PlanFeatureService } from './plan-feature.service';
import { LemonsqueezyClientService } from './lemonsqueezy-client.service';
import { LemonsqueezyWebhookController } from './lemonsqueezy-webhook.controller';
import { LemonsqueezyWebhookService } from './lemonsqueezy-webhook.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => CreditsModule),
  ],
  controllers: [BillingController, LemonsqueezyWebhookController],
  providers: [
    LemonsqueezyClientService,
    BillingService,
    BillingSyncService,
    BillingTransactionService,
    LemonsqueezyWebhookService,
    PlanFeatureService,
  ],
  exports: [PlanFeatureService, BillingSyncService],
})
export class BillingModule {}
