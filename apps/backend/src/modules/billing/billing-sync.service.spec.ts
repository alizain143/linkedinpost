import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';
import { StripeClientService } from './stripe-client.service';

describe('BillingSyncService', () => {
  let service: BillingSyncService;
  const prisma = createMockPrismaService();
  const stripeClient = {
    getClient: jest.fn(),
    getPriceConfig: jest.fn().mockReturnValue({
      priceStarter: 'price_starter',
      pricePro: 'price_pro',
      priceAgency: 'price_agency',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (ops: unknown) => {
      if (Array.isArray(ops)) {
        return Promise.all(ops);
      }
      return ops;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingSyncService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeClientService, useValue: stripeClient },
      ],
    }).compile();

    service = module.get(BillingSyncService);
  });

  it('maps active pro price to pro plan', () => {
    const plan = service.resolvePlanForSubscription(
      'active',
      'price_pro',
      stripeClient.getPriceConfig(),
    );
    expect(plan).toBe(UserPlan.pro);
  });

  it('maps deleted subscription status to free plan', () => {
    const plan = service.resolvePlanForSubscription(
      'canceled',
      'price_pro',
      stripeClient.getPriceConfig(),
    );
    expect(plan).toBe(UserPlan.free);
  });

  it('syncs active subscription and updates user plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue({ userId });
    prisma.subscription.upsert.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    await service.syncFromStripeSubscription({
      id: 'sub_1',
      customer: 'cus_1',
      status: 'active',
      cancel_at_period_end: false,
      current_period_start: 1_700_000_000,
      current_period_end: 1_702_592_000,
      items: {
        data: [{ price: { id: 'price_pro' } }],
      },
    } as never);

    expect(prisma.$transaction).toHaveBeenCalled();
    const upsertCall = prisma.subscription.upsert.mock.calls[0]?.[0];
    expect(upsertCall.update.stripePriceId).toBe('price_pro');
    const userUpdateCall = prisma.user.update.mock.calls[0]?.[0];
    expect(userUpdateCall.data.plan).toBe(UserPlan.pro);
  });

  it('downgrades user to free on subscription deleted', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      userId,
      stripeCustomerId: 'cus_1',
    });

    await service.handleSubscriptionDeleted({
      id: 'sub_1',
      customer: 'cus_1',
    } as never);

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        data: expect.objectContaining({
          status: SubscriptionStatus.canceled,
          stripeSubscriptionId: null,
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { plan: UserPlan.free },
    });
  });
});
