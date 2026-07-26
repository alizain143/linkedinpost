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
import { LemonsqueezyClientService } from './lemonsqueezy-client.service';

describe('BillingService', () => {
  let service: BillingService;
  const prisma = createMockPrismaService();
  const lemonClient = {
    isCheckoutConfigured: jest.fn().mockReturnValue(true),
    getVariantConfig: jest.fn().mockReturnValue({
      variantPro: '222',
      variantAgency: '333',
    }),
    getFrontendUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    createCheckout: jest.fn(),
    cancelSubscription: jest.fn(),
  };

  const user = {
    id: userId,
    email: 'user@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    plan: UserPlan.free,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    lemonClient.isCheckoutConfigured.mockReturnValue(true);
    lemonClient.createCheckout.mockResolvedValue({
      checkoutId: 'chk_1',
      url: 'https://linkedinpost.lemonsqueezy.com/checkout/custom/abc',
    });
    prisma.subscription.findUnique.mockResolvedValue(null);
    prisma.subscription.upsert.mockResolvedValue({});
    prisma.subscription.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: LemonsqueezyClientService, useValue: lemonClient },
      ],
    }).compile();

    service = module.get(BillingService);
  });

  it('creates checkout session with expected Lemon Squeezy args', async () => {
    const result = await service.createCheckoutSession(user as never, {
      plan: UserPlan.pro,
    });

    expect(lemonClient.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        variantId: '222',
        email: user.email,
        custom: { user_id: userId, plan: UserPlan.pro },
        redirectUrl: 'http://localhost:3000/app/billing?checkout=success',
      }),
    );
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          plan: UserPlan.pro,
          status: SubscriptionStatus.incomplete,
        }),
      }),
    );
    expect(result.url).toBe(
      'https://linkedinpost.lemonsqueezy.com/checkout/custom/abc',
    );
  });

  it('rejects checkout when billing is unavailable', async () => {
    lemonClient.isCheckoutConfigured.mockReturnValue(false);

    await expect(
      service.createCheckoutSession(user as never, {
        plan: UserPlan.pro,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects checkout when already subscribed to the same plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: false,
    });

    await expect(
      service.createCheckoutSession(
        { ...user, plan: UserPlan.pro } as never,
        { plan: UserPlan.pro },
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('cancels an active subscription at period end', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      lemonSubscriptionId: 'sub_lemon_1',
      status: SubscriptionStatus.active,
      cancelAtPeriodEnd: false,
    });

    const result = await service.cancelSubscription(userId);

    expect(lemonClient.cancelSubscription).toHaveBeenCalledWith('sub_lemon_1');
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });
    expect(result).toEqual({ cancelled: true });
  });
});
