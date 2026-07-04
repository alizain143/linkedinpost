import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SubscriptionStatus, UserPlan, type User } from '@prisma/client';
import {
  getPlanLabel,
  getXpayAmountForPlan,
} from '../../common/constants/xpay-plan.map';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { XpayClientService } from './xpay-client.service';

const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
  SubscriptionStatus.past_due,
];

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpayClient: XpayClientService,
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
      xpayCustomerId: subscription?.xpayCustomerId ?? null,
      hasBillingAccount: Boolean(subscription?.xpaySubscriptionId),
    };
  }

  async createCheckoutSession(user: User, dto: CreateCheckoutDto) {
    this.assertBillingAvailable();

    const amount = getXpayAmountForPlan(
      dto.plan,
      this.xpayClient.getAmountConfig(),
    );

    if (!amount) {
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
      user.plan === dto.plan
    ) {
      throw new ConflictException({
        error: 'You are already subscribed to this plan',
        code: 'ALREADY_SUBSCRIBED',
      });
    }

    const phone = dto.phone.trim();
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { phone },
    });

    const frontendUrl = this.xpayClient.getFrontendUrl();
    const name =
      [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(' ') ||
      updatedUser.email;

    const created = await this.xpayClient.createSubscription({
      amount,
      currency: this.xpayClient.getCurrency(),
      customerDetails: {
        name,
        email: updatedUser.email,
        contactNumber: phone,
      },
      callbackUrl: `${frontendUrl}/app/billing?checkout=success`,
      cancelUrl: `${frontendUrl}/app/billing?checkout=cancel`,
      interval: 'MONTH',
      intervalCount: 1,
      cycleCount: this.xpayClient.getCycleCount(),
      metadata: {
        userId: updatedUser.id,
        plan: dto.plan,
      },
      productPage: {
        name: `${getPlanLabel(dto.plan)} plan`,
        description: `linkedinpost.ai ${getPlanLabel(dto.plan)} subscription`,
      },
      customerId: subscription?.xpayCustomerId ?? undefined,
    });

    await this.prisma.subscription.upsert({
      where: { userId: updatedUser.id },
      create: {
        userId: updatedUser.id,
        xpaySubscriptionId: created.subscriptionId,
        plan: dto.plan,
        status: SubscriptionStatus.incomplete,
      },
      update: {
        xpaySubscriptionId: created.subscriptionId,
        plan: dto.plan,
        status: SubscriptionStatus.incomplete,
        cancelAtPeriodEnd: false,
      },
    });

    return { url: created.fwdUrl };
  }

  async cancelSubscription(userId: string) {
    this.assertBillingAvailable();

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.xpaySubscriptionId) {
      throw new ConflictException({
        error: 'No billing account found',
        code: 'BILLING_ACCOUNT_REQUIRED',
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

    await this.xpayClient.cancelSubscription(subscription.xpaySubscriptionId);

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { userId },
        data: {
          status: SubscriptionStatus.canceled,
          cancelAtPeriodEnd: false,
          xpaySubscriptionId: null,
          plan: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { plan: UserPlan.free },
      }),
    ]);

    return { cancelled: true };
  }

  private assertBillingAvailable(): void {
    if (!this.xpayClient.isCheckoutConfigured()) {
      throw new ServiceUnavailableException({
        error: 'Billing is not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }
  }
}
