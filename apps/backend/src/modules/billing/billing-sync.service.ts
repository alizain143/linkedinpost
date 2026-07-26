import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import {
  getPlanForLemonVariant,
  parsePlanFromMetadata,
  type PaidPlan,
  type LemonVariantConfig,
} from '../../common/constants/billing-plan.map';
import { PrismaService } from '../../prisma/prisma.service';

export interface LemonSubscriptionEvent {
  eventId: string;
  eventType: string;
  subscriptionId: string;
  customerId?: string | null;
  variantId?: string | number | null;
  status?: string | null;
  cancelled?: boolean | null;
  renewsAt?: string | null;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  metadata?: Record<string, string> | null;
}

const PAID_STATUSES = new Set<SubscriptionStatus>([
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
  SubscriptionStatus.past_due,
  SubscriptionStatus.unpaid,
]);

@Injectable()
export class BillingSyncService {
  private readonly logger = new Logger(BillingSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncFromSubscriptionEvent(
    event: LemonSubscriptionEvent,
    variants: LemonVariantConfig,
  ): Promise<void> {
    if (event.eventType === 'subscription_expired') {
      await this.handleSubscriptionEnded(event);
      return;
    }

    // Cancelled at period end — keep paid access until expires.
    if (event.eventType === 'subscription_cancelled' || event.cancelled) {
      await this.handleCancelAtPeriodEnd(event, variants);
      return;
    }

    const status = this.mapLemonStatus(event.status, event.eventType);
    if (!status) {
      this.logger.debug(`Unhandled Lemon event: ${event.eventType}`);
      return;
    }

    const userId = await this.resolveUserId(event);
    if (!userId) {
      this.logger.error(
        `Cannot sync subscription ${event.subscriptionId}: user not found`,
      );
      return;
    }

    const periodEnd = this.toDate(event.endsAt ?? event.renewsAt);
    const periodStart =
      status !== SubscriptionStatus.incomplete ? new Date() : null;

    if (status === SubscriptionStatus.incomplete) {
      const pendingPlan = this.resolvePlanFromEvent(event, variants);
      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          lemonSubscriptionId: event.subscriptionId,
          lemonCustomerId: event.customerId
            ? String(event.customerId)
            : undefined,
          plan: pendingPlan,
          status,
          cancelAtPeriodEnd: false,
        },
        update: {
          lemonSubscriptionId: event.subscriptionId,
          lemonCustomerId: event.customerId
            ? String(event.customerId)
            : undefined,
          plan: pendingPlan ?? undefined,
          status,
          cancelAtPeriodEnd: false,
        },
      });
      return;
    }

    const plan = await this.resolvePlanForEvent(event, status, variants);

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          lemonSubscriptionId: event.subscriptionId,
          lemonCustomerId: event.customerId
            ? String(event.customerId)
            : undefined,
          plan: plan === UserPlan.free ? null : plan,
          status,
          cancelAtPeriodEnd: false,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        update: {
          lemonSubscriptionId: event.subscriptionId,
          lemonCustomerId: event.customerId
            ? String(event.customerId)
            : undefined,
          plan: plan === UserPlan.free ? null : plan,
          status,
          cancelAtPeriodEnd: false,
          ...(periodEnd
            ? {
                currentPeriodEnd: periodEnd,
                currentPeriodStart: periodStart ?? undefined,
              }
            : {}),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { plan },
      }),
    ]);
  }

  async handleCancelAtPeriodEnd(
    event: LemonSubscriptionEvent,
    variants: LemonVariantConfig,
  ): Promise<void> {
    const userId = await this.resolveUserId(event);
    if (!userId) {
      this.logger.warn(
        `subscription cancelled for unknown subscription ${event.subscriptionId}`,
      );
      return;
    }

    const periodEnd = this.toDate(event.endsAt ?? event.renewsAt);
    const plan = await this.resolvePlanForEvent(
      event,
      SubscriptionStatus.active,
      variants,
    ).catch(() => null);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        lemonSubscriptionId: event.subscriptionId,
        lemonCustomerId: event.customerId
          ? String(event.customerId)
          : undefined,
        plan: plan && plan !== UserPlan.free ? plan : null,
        status: SubscriptionStatus.active,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: periodEnd,
      },
      update: {
        lemonSubscriptionId: event.subscriptionId,
        lemonCustomerId: event.customerId
          ? String(event.customerId)
          : undefined,
        cancelAtPeriodEnd: true,
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
        ...(plan && plan !== UserPlan.free ? { plan } : {}),
      },
    });
  }

  async handleSubscriptionEnded(event: LemonSubscriptionEvent): Promise<void> {
    const existing = await this.prisma.subscription.findUnique({
      where: { lemonSubscriptionId: event.subscriptionId },
    });

    let userId = existing?.userId ?? null;
    if (!userId) {
      userId = await this.resolveUserId(event);
    }

    if (!userId) {
      this.logger.warn(
        `subscription ended for unknown subscription ${event.subscriptionId}`,
      );
      return;
    }

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { userId },
        data: {
          lemonSubscriptionId: null,
          plan: null,
          status: SubscriptionStatus.canceled,
          cancelAtPeriodEnd: false,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { plan: UserPlan.free },
      }),
    ]);
  }

  async resolvePlanForEvent(
    event: LemonSubscriptionEvent,
    status: SubscriptionStatus,
    variants: LemonVariantConfig,
  ): Promise<UserPlan> {
    if (!PAID_STATUSES.has(status)) {
      return UserPlan.free;
    }

    const fromEvent = this.resolvePlanFromEvent(event, variants);
    if (fromEvent) {
      return fromEvent;
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { lemonSubscriptionId: event.subscriptionId },
    });

    if (existing?.plan && isPaidPlan(existing.plan)) {
      return existing.plan;
    }

    const userId = event.metadata?.user_id ?? existing?.userId;
    if (userId) {
      const byUser = await this.prisma.subscription.findUnique({
        where: { userId },
      });
      if (byUser?.plan && isPaidPlan(byUser.plan)) {
        return byUser.plan;
      }
    }

    this.logger.error(
      `Unknown plan for subscription ${event.subscriptionId}`,
    );
    throw new InternalServerErrorException({
      error: 'Active subscription missing plan metadata',
      code: 'BILLING_SYNC_ERROR',
    });
  }

  resolvePlanFromEvent(
    event: LemonSubscriptionEvent,
    variants: LemonVariantConfig,
  ): PaidPlan | null {
    const fromMetadata = parsePlanFromMetadata(event.metadata?.plan);
    if (fromMetadata) {
      return fromMetadata;
    }

    return getPlanForLemonVariant(event.variantId, variants);
  }

  private async resolveUserId(
    event: LemonSubscriptionEvent,
  ): Promise<string | null> {
    const fromMetadata = event.metadata?.user_id;
    if (fromMetadata) {
      return fromMetadata;
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { lemonSubscriptionId: event.subscriptionId },
    });

    return existing?.userId ?? null;
  }

  mapLemonStatus(
    lemonStatus: string | null | undefined,
    eventType: string,
  ): SubscriptionStatus | null {
    switch (lemonStatus) {
      case 'active':
        return SubscriptionStatus.active;
      case 'on_trial':
        return SubscriptionStatus.trialing;
      case 'past_due':
        return SubscriptionStatus.past_due;
      case 'unpaid':
        return SubscriptionStatus.unpaid;
      case 'paused':
        return SubscriptionStatus.past_due;
      case 'cancelled':
        return SubscriptionStatus.active;
      case 'expired':
        return SubscriptionStatus.canceled;
      case 'incomplete':
        return SubscriptionStatus.incomplete;
      default:
        break;
    }

    switch (eventType) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_resumed':
      case 'subscription_unpaused':
      case 'subscription_payment_success':
        return SubscriptionStatus.active;
      case 'subscription_paused':
      case 'subscription_payment_failed':
        return SubscriptionStatus.past_due;
      default:
        return null;
    }
  }

  private toDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}

function isPaidPlan(plan: UserPlan): plan is PaidPlan {
  return (
    plan === UserPlan.starter ||
    plan === UserPlan.pro ||
    plan === UserPlan.agency
  );
}
