import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SubscriptionStatus, UserPlan, type User } from '@prisma/client';
import { getLemonVariantForPlan } from '../../common/constants/billing-plan.map';
import {
  CreditTopupValidationError,
  quoteCreditTopup,
} from '../../common/constants/credit-topup.pricing';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { LemonsqueezyClientService } from './lemonsqueezy-client.service';

const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
  SubscriptionStatus.past_due,
];

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lemonClient: LemonsqueezyClientService,
  ) {}

  async getBillingStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true },
    });

    const subscription = user.subscription;

    return {
      plan: user.plan,
      subscriptionStatus: subscription?.status ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
      lemonCustomerId: subscription?.lemonCustomerId ?? null,
      hasBillingAccount: Boolean(subscription?.lemonSubscriptionId),
    };
  }

  quoteCredits(credits: number) {
    try {
      return quoteCreditTopup(credits);
    } catch (error) {
      if (error instanceof CreditTopupValidationError) {
        throw new BadRequestException({
          error: error.message,
          code: 'VALIDATION_ERROR',
        });
      }
      throw error;
    }
  }

  async createCreditCheckoutSession(user: User, credits: number) {
    if (!this.lemonClient.isCreditsCheckoutConfigured()) {
      throw new ServiceUnavailableException({
        error: 'Credit top-ups are not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    const quote = this.quoteCredits(credits);
    const variantId = this.lemonClient.getCreditsVariantId();
    if (!variantId) {
      throw new ServiceUnavailableException({
        error: 'Credit top-ups are not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    const frontendUrl = this.lemonClient.getFrontendUrl();
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;

    const created = await this.lemonClient.createCheckout({
      variantId,
      email: user.email,
      name,
      customPriceCents: quote.totalCents,
      custom: {
        user_id: user.id,
        credits: String(quote.credits),
      },
      redirectUrl: `${frontendUrl}/app/billing?checkout=credits_success`,
      receiptThankYouNote: `Thanks — ${quote.credits} credits will appear in your linkedinpost.ai account shortly.`,
    });

    return { url: created.url };
  }

  async listTransactions(
    userId: string,
    options: { limit?: number; cursor?: string } = {},
  ) {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
    const cursor = this.decodeCursor(options.cursor);

    const rows = await this.prisma.billingTransaction.findMany({
      where: {
        userId,
        ...(cursor
          ? {
              OR: [
                { occurredAt: { lt: cursor.occurredAt } },
                {
                  occurredAt: cursor.occurredAt,
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return {
      items: page.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        amountCents: row.amountCents,
        currency: row.currency,
        description: row.description,
        creditsGranted: row.creditsGranted,
        plan: row.plan,
        occurredAt: row.occurredAt.toISOString(),
      })),
      nextCursor: hasMore && last ? this.encodeCursor(last) : null,
    };
  }

  async createCheckoutSession(user: User, dto: CreateCheckoutDto) {
    this.assertBillingAvailable();

    const variantId = getLemonVariantForPlan(
      dto.plan,
      this.lemonClient.getVariantConfig(),
    );

    if (!variantId) {
      throw new ServiceUnavailableException({
        error: 'Billing is not configured for this plan',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (
      subscription &&
      ACTIVE_STATUSES.includes(subscription.status) &&
      user.plan === dto.plan &&
      !subscription.cancelAtPeriodEnd
    ) {
      throw new ConflictException({
        error: 'You are already subscribed to this plan',
        code: 'ALREADY_SUBSCRIBED',
      });
    }

    const frontendUrl = this.lemonClient.getFrontendUrl();
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;

    const created = await this.lemonClient.createCheckout({
      variantId,
      email: user.email,
      name,
      custom: {
        user_id: user.id,
        plan: dto.plan,
      },
      redirectUrl: `${frontendUrl}/app/billing?checkout=success`,
    });

    await this.prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: dto.plan,
        status: SubscriptionStatus.incomplete,
      },
      update: {
        plan: dto.plan,
        status: SubscriptionStatus.incomplete,
        cancelAtPeriodEnd: false,
      },
    });

    return { url: created.url };
  }

  async cancelSubscription(userId: string) {
    this.assertBillingAvailable();

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.lemonSubscriptionId) {
      throw new ConflictException({
        error: 'No billing account found',
        code: 'BILLING_ACCOUNT_REQUIRED',
      });
    }

    if (subscription.cancelAtPeriodEnd) {
      throw new ConflictException({
        error: 'Subscription is already set to cancel',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
    }

    if (
      subscription.status === SubscriptionStatus.canceled ||
      !ACTIVE_STATUSES.includes(subscription.status)
    ) {
      throw new ConflictException({
        error: 'No active subscription to cancel',
        code: 'NO_ACTIVE_SUBSCRIPTION',
      });
    }

    await this.lemonClient.cancelSubscription(subscription.lemonSubscriptionId);

    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    return { cancelled: true };
  }

  private assertBillingAvailable(): void {
    if (!this.lemonClient.isCheckoutConfigured()) {
      throw new ServiceUnavailableException({
        error: 'Billing is not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }
  }

  private encodeCursor(row: { occurredAt: Date; id: string }): string {
    return Buffer.from(
      JSON.stringify({
        occurredAt: row.occurredAt.toISOString(),
        id: row.id,
      }),
      'utf8',
    ).toString('base64url');
  }

  private decodeCursor(
    cursor: string | undefined,
  ): { occurredAt: Date; id: string } | null {
    if (!cursor) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as { occurredAt?: string; id?: string };
      if (!parsed.occurredAt || !parsed.id) {
        return null;
      }
      const occurredAt = new Date(parsed.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        return null;
      }
      return { occurredAt, id: parsed.id };
    } catch {
      throw new BadRequestException({
        error: 'Invalid cursor',
        code: 'VALIDATION_ERROR',
      });
    }
  }
}
