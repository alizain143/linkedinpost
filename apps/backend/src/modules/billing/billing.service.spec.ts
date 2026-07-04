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
import { XpayClientService } from './xpay-client.service';

describe('BillingService', () => {
  let service: BillingService;
  const prisma = createMockPrismaService();
  const xpayClient = {
    isCheckoutConfigured: jest.fn().mockReturnValue(true),
    getAmountConfig: jest.fn().mockReturnValue({
      amountStarter: 900,
      amountPro: 1900,
      amountAgency: 4900,
    }),
    getCurrency: jest.fn().mockReturnValue('USD'),
    getCycleCount: jest.fn().mockReturnValue(120),
    getFrontendUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    createSubscription: jest.fn(),
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
    xpayClient.isCheckoutConfigured.mockReturnValue(true);
    xpayClient.createSubscription.mockResolvedValue({
      subscriptionId: 'sub_xpay_1',
      fwdUrl: 'https://pay.xpaycheckout.com/?subscription_id=sub_xpay_1',
    });
    prisma.subscription.findUnique.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue({ ...user, phone: '+923001234567' });
    prisma.subscription.upsert.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prisma },
        { provide: XpayClientService, useValue: xpayClient },
      ],
    }).compile();

    service = module.get(BillingService);
  });

  it('creates checkout session with expected XPay args', async () => {
    const result = await service.createCheckoutSession(user as never, {
      plan: UserPlan.pro,
      phone: '+923001234567',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { phone: '+923001234567' },
    });
    expect(xpayClient.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1900,
        currency: 'USD',
        interval: 'MONTH',
        intervalCount: 1,
        cycleCount: 120,
        customerDetails: expect.objectContaining({
          email: user.email,
          contactNumber: '+923001234567',
        }),
        metadata: { userId, plan: UserPlan.pro },
      }),
    );
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          xpaySubscriptionId: 'sub_xpay_1',
          plan: UserPlan.pro,
          status: SubscriptionStatus.incomplete,
        }),
      }),
    );
    expect(result.url).toBe(
      'https://pay.xpaycheckout.com/?subscription_id=sub_xpay_1',
    );
  });

  it('rejects checkout when billing is unavailable', async () => {
    xpayClient.isCheckoutConfigured.mockReturnValue(false);

    await expect(
      service.createCheckoutSession(user as never, {
        plan: UserPlan.pro,
        phone: '+923001234567',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects checkout when already subscribed to the same plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      status: SubscriptionStatus.active,
    });

    await expect(
      service.createCheckoutSession(
        { ...user, plan: UserPlan.pro } as never,
        { plan: UserPlan.pro, phone: '+923001234567' },
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('cancels an active subscription', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      xpaySubscriptionId: 'sub_xpay_1',
      status: SubscriptionStatus.active,
    });
    prisma.$transaction.mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return ops;
    });

    const result = await service.cancelSubscription(userId);

    expect(xpayClient.cancelSubscription).toHaveBeenCalledWith('sub_xpay_1');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { plan: UserPlan.free },
    });
    expect(result).toEqual({ cancelled: true });
  });
});
