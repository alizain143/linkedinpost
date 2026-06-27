import {
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from './billing.service';
import { StripeClientService } from './stripe-client.service';
import { StripeCustomerService } from './stripe-customer.service';

describe('BillingService', () => {
  let service: BillingService;
  const prisma = createMockPrismaService();
  const stripeClient = {
    isCheckoutConfigured: jest.fn().mockReturnValue(true),
    getClient: jest.fn(),
    getPriceConfig: jest.fn().mockReturnValue({
      priceStarter: 'price_starter',
      pricePro: 'price_pro',
      priceAgency: 'price_agency',
    }),
    getFrontendUrl: jest.fn().mockReturnValue('http://localhost:3000'),
  };
  const stripeCustomerService = {
    getOrCreateStripeCustomer: jest.fn().mockResolvedValue('cus_1'),
  };
  const checkoutCreate = jest.fn();

  const user = {
    id: userId,
    email: 'user@example.com',
    plan: UserPlan.free,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    stripeClient.getClient.mockReturnValue({
      checkout: { sessions: { create: checkoutCreate } },
      billingPortal: { sessions: { create: jest.fn() } },
    });
    checkoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
    prisma.subscription.findUnique.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeClientService, useValue: stripeClient },
        { provide: StripeCustomerService, useValue: stripeCustomerService },
      ],
    }).compile();

    service = module.get(BillingService);
  });

  it('creates checkout session with expected Stripe args', async () => {
    const result = await service.createCheckoutSession(user as never, {
      plan: UserPlan.pro,
    });

    expect(stripeCustomerService.getOrCreateStripeCustomer).toHaveBeenCalledWith(
      user,
    );
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_1',
        line_items: [{ price: 'price_pro', quantity: 1 }],
        client_reference_id: userId,
        metadata: { userId, plan: UserPlan.pro },
      }),
    );
    expect(result.url).toBe('https://checkout.stripe.com/test');
  });

  it('rejects checkout when billing is unavailable', async () => {
    stripeClient.isCheckoutConfigured.mockReturnValue(false);

    await expect(
      service.createCheckoutSession(user as never, { plan: UserPlan.pro }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects checkout when already subscribed to the same plan', async () => {
    stripeClient.isCheckoutConfigured.mockReturnValue(true);
    prisma.subscription.findUnique.mockResolvedValue({
      status: SubscriptionStatus.active,
    });

    await expect(
      service.createCheckoutSession(
        { ...user, plan: UserPlan.pro } as never,
        { plan: UserPlan.pro },
      ),
    ).rejects.toThrow(ConflictException);
  });
});
