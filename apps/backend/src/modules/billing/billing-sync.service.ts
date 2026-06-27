import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import Stripe from 'stripe';
import {
  getPlanForStripePriceId,
  StripePriceConfig,
} from '../../common/constants/stripe-plan.map';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeClientService } from './stripe-client.service';

const PAID_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'trialing',
  'past_due',
]);

@Injectable()
export class BillingSyncService {
  private readonly logger = new Logger(BillingSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClientService,
  ) {}

  async syncFromCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
    const userId =
      session.client_reference_id ??
      session.metadata?.userId ??
      null;

    if (!userId) {
      this.logger.warn(
        `checkout.session.completed missing userId for session ${session.id}`,
      );
      return;
    }

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (!stripeCustomerId) {
      this.logger.warn(
        `checkout.session.completed missing customer for session ${session.id}`,
      );
      return;
    }

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId,
      },
      update: {
        stripeCustomerId,
      },
    });

    if (session.mode === 'subscription' && session.subscription) {
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

      const stripe = this.stripeClient.getClient();
      if (!stripe) {
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await this.syncFromStripeSubscription(subscription, userId);
    }
  }

  async syncFromStripeSubscription(
    subscription: Stripe.Subscription,
    userIdHint?: string,
  ): Promise<void> {
    const stripeCustomerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const priceId = subscription.items.data[0]?.price?.id ?? null;
    const prices = this.stripeClient.getPriceConfig();
    const period = this.readSubscriptionPeriod(subscription);

    let userId = userIdHint ?? null;
    if (!userId) {
      const existing = await this.prisma.subscription.findUnique({
        where: { stripeCustomerId },
      });
      userId = existing?.userId ?? null;
    }

    if (!userId) {
      this.logger.error(
        `Cannot sync subscription ${subscription.id}: user not found for customer ${stripeCustomerId}`,
      );
      return;
    }

    const plan = this.resolvePlanForSubscription(
      subscription.status,
      priceId,
      prices,
    );

    const status = this.mapStripeStatus(subscription.status);

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        },
        update: {
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: period.start,
          currentPeriodEnd: period.end,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { plan },
      }),
    ]);
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const stripeCustomerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

    const existing = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId },
    });

    if (!existing) {
      this.logger.warn(
        `customer.subscription.deleted for unknown customer ${stripeCustomerId}`,
      );
      return;
    }

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { userId: existing.userId },
        data: {
          stripeSubscriptionId: null,
          stripePriceId: null,
          status: SubscriptionStatus.canceled,
          cancelAtPeriodEnd: false,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      }),
      this.prisma.user.update({
        where: { id: existing.userId },
        data: { plan: UserPlan.free },
      }),
    ]);
  }

  async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const stripeCustomerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    if (!stripeCustomerId) {
      return;
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId },
    });

    if (!existing) {
      return;
    }

    await this.prisma.subscription.update({
      where: { userId: existing.userId },
      data: { status: SubscriptionStatus.past_due },
    });
  }

  resolvePlanForSubscription(
    stripeStatus: Stripe.Subscription.Status,
    priceId: string | null,
    prices: StripePriceConfig,
  ): UserPlan {
    if (!PAID_STRIPE_STATUSES.has(stripeStatus)) {
      return UserPlan.free;
    }

    if (!priceId) {
      return UserPlan.free;
    }

    const plan = getPlanForStripePriceId(priceId, prices);
    if (!plan) {
      this.logger.error(`Unknown Stripe price ID: ${priceId}`);
      return UserPlan.free;
    }

    return plan;
  }

  private mapStripeStatus(
    status: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.active;
      case 'trialing':
        return SubscriptionStatus.trialing;
      case 'past_due':
        return SubscriptionStatus.past_due;
      case 'canceled':
        return SubscriptionStatus.canceled;
      case 'unpaid':
        return SubscriptionStatus.unpaid;
      case 'incomplete':
      case 'incomplete_expired':
      default:
        return SubscriptionStatus.incomplete;
    }
  }

  private toDate(unixSeconds: number | null | undefined): Date | null {
    if (!unixSeconds) {
      return null;
    }
    return new Date(unixSeconds * 1000);
  }

  private readSubscriptionPeriod(subscription: Stripe.Subscription): {
    start: Date | null;
    end: Date | null;
  } {
    const raw = subscription as Stripe.Subscription & {
      current_period_start?: number;
      current_period_end?: number;
    };

    if (raw.current_period_start || raw.current_period_end) {
      return {
        start: this.toDate(raw.current_period_start),
        end: this.toDate(raw.current_period_end),
      };
    }

    const item = subscription.items.data[0] as
      | (Stripe.SubscriptionItem & {
          current_period_start?: number;
          current_period_end?: number;
        })
      | undefined;

    return {
      start: this.toDate(item?.current_period_start),
      end: this.toDate(item?.current_period_end),
    };
  }
}
