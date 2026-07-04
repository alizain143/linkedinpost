import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import {
  parsePlanFromMetadata,
  type CheckoutPlan,
} from '../../common/constants/xpay-plan.map';
import { PrismaService } from '../../prisma/prisma.service';

export interface XpaySubscriptionEvent {
  eventId: string;
  eventType: string;
  eventTime?: number;
  subscriptionId: string;
  nextPaymentDate?: number | null;
  remainingCycleCount?: number | null;
  metadata?: Record<string, string> | null;
  errorCode?: string;
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

  async syncFromSubscriptionEvent(event: XpaySubscriptionEvent): Promise<void> {
    const status = this.mapEventToStatus(event.eventType);
    if (!status) {
      this.logger.debug(`Unhandled XPay event type: ${event.eventType}`);
      return;
    }

    if (
      status === SubscriptionStatus.canceled ||
      event.eventType === 'subscription.ended'
    ) {
      await this.handleSubscriptionEnded(event);
      return;
    }

    const userId = await this.resolveUserId(event);
    if (!userId) {
      this.logger.error(
        `Cannot sync subscription ${event.subscriptionId}: user not found`,
      );
      return;
    }

    const periodEnd = this.toDate(event.nextPaymentDate);
    const periodStart =
      periodEnd && status !== SubscriptionStatus.incomplete
        ? new Date()
        : null;

    // Incomplete checkout events only track the pending subscription row.
    if (status === SubscriptionStatus.incomplete) {
      const pendingPlan = parsePlanFromMetadata(event.metadata?.plan);
      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          xpaySubscriptionId: event.subscriptionId,
          plan: pendingPlan,
          status,
          cancelAtPeriodEnd: false,
        },
        update: {
          xpaySubscriptionId: event.subscriptionId,
          plan: pendingPlan ?? undefined,
          status,
          cancelAtPeriodEnd: false,
        },
      });
      return;
    }

    const plan = await this.resolvePlanForEvent(event, status);

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          xpaySubscriptionId: event.subscriptionId,
          plan: plan === UserPlan.free ? null : plan,
          status,
          cancelAtPeriodEnd: false,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        update: {
          xpaySubscriptionId: event.subscriptionId,
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

  async handleSubscriptionEnded(event: XpaySubscriptionEvent): Promise<void> {
    const existing = await this.prisma.subscription.findUnique({
      where: { xpaySubscriptionId: event.subscriptionId },
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
          xpaySubscriptionId: null,
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
    event: XpaySubscriptionEvent,
    status: SubscriptionStatus,
  ): Promise<UserPlan> {
    if (!PAID_STATUSES.has(status)) {
      return UserPlan.free;
    }

    const fromMetadata = parsePlanFromMetadata(event.metadata?.plan);
    if (fromMetadata) {
      return fromMetadata;
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { xpaySubscriptionId: event.subscriptionId },
    });

    if (existing?.plan && isPaidPlan(existing.plan)) {
      return existing.plan;
    }

    const userId = event.metadata?.userId ?? existing?.userId;
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

  private async resolveUserId(
    event: XpaySubscriptionEvent,
  ): Promise<string | null> {
    const fromMetadata = event.metadata?.userId;
    if (fromMetadata) {
      return fromMetadata;
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { xpaySubscriptionId: event.subscriptionId },
    });

    return existing?.userId ?? null;
  }

  mapEventToStatus(eventType: string): SubscriptionStatus | null {
    switch (eventType) {
      case 'subscription.active':
      case 'subscription.cycle_charged':
        return SubscriptionStatus.active;
      case 'subscription.trialing':
        return SubscriptionStatus.trialing;
      case 'subscription.unpaid':
        return SubscriptionStatus.unpaid;
      case 'subscription.paused':
        return SubscriptionStatus.past_due;
      case 'subscription.cancelled':
      case 'subscription.ended':
        return SubscriptionStatus.canceled;
      case 'subscription.created':
      case 'subscription.checkout_opened':
        return SubscriptionStatus.incomplete;
      default:
        return null;
    }
  }

  private toDate(ms: number | null | undefined): Date | null {
    if (!ms) {
      return null;
    }
    return new Date(ms);
  }
}

function isPaidPlan(plan: UserPlan): plan is CheckoutPlan {
  return (
    plan === UserPlan.starter ||
    plan === UserPlan.pro ||
    plan === UserPlan.agency
  );
}
