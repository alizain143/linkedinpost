import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BillingWebhookEventStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BillingSyncService,
  type XpaySubscriptionEvent,
} from './billing-sync.service';
import { XpayClientService } from './xpay-client.service';

@Injectable()
export class XpayWebhookService {
  private readonly logger = new Logger(XpayWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xpayClient: XpayClientService,
    private readonly billingSync: BillingSyncService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException({
        error: 'Missing XPay signature',
        code: 'WEBHOOK_INVALID',
      });
    }

    if (!this.xpayClient.isWebhookConfigured()) {
      throw new BadRequestException({
        error: 'XPay webhooks are not configured',
        code: 'WEBHOOK_INVALID',
      });
    }

    if (!this.xpayClient.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('XPay webhook signature verification failed');
      throw new BadRequestException({
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_INVALID',
      });
    }

    let event: XpaySubscriptionEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as XpaySubscriptionEvent;
    } catch {
      throw new BadRequestException({
        error: 'Invalid webhook payload',
        code: 'WEBHOOK_INVALID',
      });
    }

    if (!event.eventId || !event.eventType) {
      throw new BadRequestException({
        error: 'Webhook payload missing eventId or eventType',
        code: 'WEBHOOK_INVALID',
      });
    }

    const existing = await this.prisma.billingWebhookEvent.findUnique({
      where: { id: event.eventId },
    });

    if (existing?.status === BillingWebhookEventStatus.processed) {
      return { received: true, duplicate: true };
    }

    if (!existing) {
      await this.prisma.billingWebhookEvent.create({
        data: {
          id: event.eventId,
          type: event.eventType,
          status: BillingWebhookEventStatus.pending,
        },
      });
    }

    try {
      await this.dispatchEvent(event);

      await this.prisma.billingWebhookEvent.update({
        where: { id: event.eventId },
        data: {
          status: BillingWebhookEventStatus.processed,
          processedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Webhook dispatch failed';

      await this.prisma.billingWebhookEvent.update({
        where: { id: event.eventId },
        data: {
          status: BillingWebhookEventStatus.failed,
          errorMessage: message,
        },
      });

      throw error;
    }

    return { received: true };
  }

  private async dispatchEvent(event: XpaySubscriptionEvent): Promise<void> {
    if (!event.eventType.startsWith('subscription.')) {
      this.logger.debug(`Ignoring non-subscription event: ${event.eventType}`);
      return;
    }

    if (!event.subscriptionId) {
      this.logger.warn(
        `Subscription event ${event.eventId} missing subscriptionId`,
      );
      return;
    }

    await this.billingSync.syncFromSubscriptionEvent(event);
  }
}
