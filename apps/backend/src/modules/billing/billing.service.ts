import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SubscriptionStatus, UserPlan, type User } from '@prisma/client';
import { getStripePriceIdForPlan } from '../../common/constants/stripe-plan.map';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { StripeClientService } from './stripe-client.service';
import { StripeCustomerService } from './stripe-customer.service';

const ACTIVE_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.active,
  SubscriptionStatus.trialing,
  SubscriptionStatus.past_due,
];

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClientService,
    private readonly stripeCustomerService: StripeCustomerService,
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
      stripeCustomerId: subscription?.stripeCustomerId ?? null,
    };
  }

  async createCheckoutSession(user: User, dto: CreateCheckoutDto) {
    this.assertBillingAvailable();

    const priceId = getStripePriceIdForPlan(
      dto.plan,
      this.stripeClient.getPriceConfig(),
    );

    if (!priceId) {
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

    const stripe = this.stripeClient.getClient()!;
    const customerId =
      await this.stripeCustomerService.getOrCreateStripeCustomer(user);
    const frontendUrl = this.stripeClient.getFrontendUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing?checkout=success`,
      cancel_url: `${frontendUrl}/billing?checkout=cancel`,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan: dto.plan },
    });

    if (!session.url) {
      throw new ServiceUnavailableException({
        error: 'Failed to create checkout session',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    this.assertBillingAvailable();

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new ConflictException({
        error: 'No billing account found',
        code: 'BILLING_ACCOUNT_REQUIRED',
      });
    }

    const stripe = this.stripeClient.getClient()!;
    const frontendUrl = this.stripeClient.getFrontendUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  private assertBillingAvailable(): void {
    if (!this.stripeClient.isCheckoutConfigured()) {
      throw new ServiceUnavailableException({
        error: 'Billing is not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }
  }
}
