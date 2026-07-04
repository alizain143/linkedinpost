import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingSyncService } from './billing-sync.service';
import { PlanFeatureService } from './plan-feature.service';
import { XpayClientService } from './xpay-client.service';
import { XpayWebhookController } from './xpay-webhook.controller';
import { XpayWebhookService } from './xpay-webhook.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [BillingController, XpayWebhookController],
  providers: [
    XpayClientService,
    BillingService,
    BillingSyncService,
    XpayWebhookService,
    PlanFeatureService,
  ],
  exports: [PlanFeatureService, BillingSyncService],
})
export class BillingModule {}
