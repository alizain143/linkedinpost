import { createHash } from 'crypto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  BillingTransactionStatus,
  BillingTransactionType,
  BillingWebhookEventStatus,
  UserPlan,
} from '@prisma/client';
import { parsePlanFromMetadata, getPlanLabel } from '../../common/constants/billing-plan.map';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BillingSyncService,
  type LemonSubscriptionEvent,
} from './billing-sync.service';
import { BillingTransactionService } from './billing-transaction.service';
import { LemonsqueezyClientService } from './lemonsqueezy-client.service';

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string | number> | null;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

const SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_resumed',
  'subscription_expired',
  'subscription_paused',
  'subscription_unpaused',
]);

const ORDER_EVENTS = new Set(['order_created', 'order_refunded']);

const INVOICE_EVENTS = new Set([
  'subscription_payment_success',
  'subscription_payment_failed',
  'subscription_payment_refunded',
]);

@Injectable()
export class LemonsqueezyWebhookService {
  private readonly logger = new Logger(LemonsqueezyWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lemonClient: LemonsqueezyClientService,
    private readonly billingSync: BillingSyncService,
    private readonly billingTransactions: BillingTransactionService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException({
        error: 'Missing Lemon Squeezy signature',
        code: 'WEBHOOK_INVALID',
      });
    }

    if (!this.lemonClient.isWebhookConfigured()) {
      throw new BadRequestException({
        error: 'Lemon Squeezy webhooks are not configured',
        code: 'WEBHOOK_INVALID',
      });
    }

    if (!this.lemonClient.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn('Lemon Squeezy webhook signature verification failed');
      throw new BadRequestException({
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_INVALID',
      });
    }

    let payload: LemonWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as LemonWebhookPayload;
    } catch {
      throw new BadRequestException({
        error: 'Invalid webhook payload',
        code: 'WEBHOOK_INVALID',
      });
    }

    const eventType = payload.meta?.event_name;
    if (!eventType) {
      throw new BadRequestException({
        error: 'Webhook payload missing event name',
        code: 'WEBHOOK_INVALID',
      });
    }

    const eventId = this.buildEventId(payload, eventType);

    const existing = await this.prisma.billingWebhookEvent.findUnique({
      where: { id: eventId },
    });

    if (existing?.status === BillingWebhookEventStatus.processed) {
      return { received: true, duplicate: true };
    }

    if (!existing) {
      await this.prisma.billingWebhookEvent.create({
        data: {
          id: eventId,
          type: eventType,
          status: BillingWebhookEventStatus.pending,
        },
      });
    }

    try {
      await this.dispatch(payload, eventType, eventId);

      await this.prisma.billingWebhookEvent.update({
        where: { id: eventId },
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
        where: { id: eventId },
        data: {
          status: BillingWebhookEventStatus.failed,
          errorMessage: message,
        },
      });

      throw error;
    }

    return { received: true };
  }

  private async dispatch(
    payload: LemonWebhookPayload,
    eventType: string,
    eventId: string,
  ): Promise<void> {
    if (ORDER_EVENTS.has(eventType)) {
      await this.handleOrderEvent(payload, eventType, eventId);
      return;
    }

    if (INVOICE_EVENTS.has(eventType)) {
      await this.handleInvoiceEvent(payload, eventType, eventId);
      return;
    }

    if (SUBSCRIPTION_EVENTS.has(eventType)) {
      const event = this.toSubscriptionEvent(payload, eventType, eventId);
      if (!event) {
        return;
      }
      await this.billingSync.syncFromSubscriptionEvent(
        event,
        this.lemonClient.getVariantConfig(),
      );
      return;
    }

    // subscription_payment_success also used to update subscription status via sync
    // when payload is subscription — already covered by INVOICE_EVENTS for invoices.
    this.logger.debug(`Ignoring unhandled Lemon event: ${eventType}`);
  }

  private async handleOrderEvent(
    payload: LemonWebhookPayload,
    eventType: string,
    eventId: string,
  ): Promise<void> {
    if (payload.data?.type !== 'orders' || !payload.data.id) {
      this.logger.warn(`${eventType} missing order data`);
      return;
    }

    const attrs = payload.data.attributes ?? {};
    const custom = this.normalizeCustom(payload.meta?.custom_data);
    const orderId = String(payload.data.id);
    const occurredAt = this.toDate(attrs.created_at) ?? new Date();
    const amountCents = this.toInt(attrs.total) ?? 0;
    const currency = String(attrs.currency ?? 'USD').toUpperCase();
    const email =
      typeof attrs.user_email === 'string' ? attrs.user_email : null;

    const userId = await this.billingTransactions.resolveUserId({
      userId: custom.user_id ?? null,
      email,
    });

    if (eventType === 'order_refunded') {
      await this.billingTransactions.markRefunded({
        providerEventId: eventId,
        providerOrderId: orderId,
        userId,
        amountCents,
        currency,
        occurredAt,
      });
      return;
    }

    // order_created
    const creditsRaw = custom.credits;
    const credits = creditsRaw ? Number.parseInt(creditsRaw, 10) : NaN;

    if (!Number.isFinite(credits) || credits <= 0) {
      // Subscription initial order — payment history comes from subscription_payment_success
      this.logger.debug(
        `order_created ${orderId} without credits custom_data; skipping credit grant`,
      );
      return;
    }

    if (!userId) {
      this.logger.error(
        `Credit order ${orderId} missing resolvable user_id`,
      );
      return;
    }

    await this.billingTransactions.grantCreditsFromOrder({
      userId,
      credits,
      orderId,
      amountCents,
      currency,
      providerEventId: eventId,
      occurredAt,
    });
  }

  private async handleInvoiceEvent(
    payload: LemonWebhookPayload,
    eventType: string,
    eventId: string,
  ): Promise<void> {
    if (
      payload.data?.type !== 'subscription-invoices' ||
      !payload.data.id
    ) {
      this.logger.warn(`${eventType} missing subscription-invoice data`);
      return;
    }

    const attrs = payload.data.attributes ?? {};
    const custom = this.normalizeCustom(payload.meta?.custom_data);
    const invoiceId = String(payload.data.id);
    const subscriptionId =
      attrs.subscription_id != null ? String(attrs.subscription_id) : null;
    const orderId = attrs.order_id != null ? String(attrs.order_id) : null;
    const customerId =
      attrs.customer_id != null ? String(attrs.customer_id) : null;
    const email =
      typeof attrs.user_email === 'string' ? attrs.user_email : null;
    const occurredAt =
      this.toDate(attrs.created_at) ??
      this.toDate(attrs.updated_at) ??
      new Date();
    const amountCents = this.toInt(attrs.total) ?? 0;
    const currency = String(attrs.currency ?? 'USD').toUpperCase();

    const userId = await this.billingTransactions.resolveUserId({
      userId: custom.user_id ?? null,
      lemonSubscriptionId: subscriptionId,
      lemonCustomerId: customerId,
      email,
    });

    if (!userId) {
      this.logger.warn(
        `Invoice event ${eventType} ${invoiceId} could not resolve user`,
      );
      return;
    }

    if (eventType === 'subscription_payment_refunded') {
      await this.billingTransactions.markRefunded({
        providerEventId: eventId,
        providerOrderId: orderId,
        providerInvoiceId: invoiceId,
        userId,
        amountCents,
        currency,
        occurredAt,
      });
      return;
    }

    const plan =
      parsePlanFromMetadata(custom.plan) ??
      (await this.prisma.subscription.findUnique({ where: { userId } }))
        ?.plan ??
      null;

    const planLabel = plan ? getPlanLabel(plan) : 'Subscription';
    const status =
      eventType === 'subscription_payment_failed'
        ? BillingTransactionStatus.failed
        : BillingTransactionStatus.paid;

    await this.billingTransactions.recordTransaction({
      userId,
      type: BillingTransactionType.subscription_payment,
      status,
      amountCents,
      currency,
      description:
        status === BillingTransactionStatus.failed
          ? `${planLabel} plan — payment failed`
          : `${planLabel} plan — monthly`,
      plan: plan === UserPlan.free ? null : plan,
      providerEventId: eventId,
      providerOrderId: orderId,
      providerInvoiceId: invoiceId,
      occurredAt,
    });
  }

  private toSubscriptionEvent(
    payload: LemonWebhookPayload,
    eventType: string,
    eventId: string,
  ): LemonSubscriptionEvent | null {
    if (payload.data?.type !== 'subscriptions' || !payload.data.id) {
      this.logger.warn(`Subscription event ${eventType} missing data.id`);
      return null;
    }

    const attrs = payload.data.attributes ?? {};
    const custom = this.normalizeCustom(payload.meta?.custom_data);

    return {
      eventId,
      eventType,
      subscriptionId: String(payload.data.id),
      customerId:
        attrs.customer_id != null ? String(attrs.customer_id) : null,
      variantId:
        attrs.variant_id != null
          ? (attrs.variant_id as string | number)
          : null,
      status: typeof attrs.status === 'string' ? attrs.status : null,
      cancelled:
        typeof attrs.cancelled === 'boolean' ? attrs.cancelled : null,
      renewsAt: typeof attrs.renews_at === 'string' ? attrs.renews_at : null,
      endsAt: typeof attrs.ends_at === 'string' ? attrs.ends_at : null,
      trialEndsAt:
        typeof attrs.trial_ends_at === 'string' ? attrs.trial_ends_at : null,
      metadata: custom,
    };
  }

  private buildEventId(
    payload: LemonWebhookPayload,
    eventType: string,
  ): string {
    const attrs = payload.data?.attributes ?? {};
    return createHash('sha256')
      .update(
        [
          eventType,
          payload.data?.type ?? '',
          payload.data?.id ?? '',
          String(attrs.updated_at ?? attrs.created_at ?? ''),
          String(attrs.status ?? ''),
          String(attrs.cancelled ?? ''),
          String(attrs.total ?? ''),
        ].join(':'),
      )
      .digest('hex')
      .slice(0, 64);
  }

  private normalizeCustom(
    custom: Record<string, string | number> | null | undefined,
  ): Record<string, string> {
    if (!custom) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(custom).map(([key, value]) => [key, String(value)]),
    );
  }

  private toDate(value: unknown): Date | null {
    if (typeof value !== 'string' || !value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value);
    }
    if (typeof value === 'string' && value.trim()) {
      const n = Number.parseInt(value, 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
}
