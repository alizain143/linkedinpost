import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';
import { StripeClientService } from './stripe-client.service';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClientService,
    private readonly billingSync: BillingSyncService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException({
        error: 'Missing Stripe signature',
        code: 'WEBHOOK_INVALID',
      });
    }

    const stripe = this.stripeClient.getClient();
    const webhookSecret = this.stripeClient.getWebhookSecret();

    if (!stripe || !webhookSecret) {
      throw new BadRequestException({
        error: 'Stripe webhooks are not configured',
        code: 'WEBHOOK_INVALID',
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.warn(`Stripe webhook signature verification failed: ${error}`);
      throw new BadRequestException({
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_INVALID',
      });
    }

    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { id: event.id },
    });

    if (existing) {
      return { received: true, duplicate: true };
    }

    await this.prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });

    await this.dispatchEvent(event);

    return { received: true };
  }

  private async dispatchEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.billingSync.syncFromCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.billingSync.syncFromStripeSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'customer.subscription.deleted':
        await this.billingSync.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case 'invoice.payment_failed':
        await this.billingSync.handlePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }
}
