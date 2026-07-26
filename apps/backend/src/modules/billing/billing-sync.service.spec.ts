import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';

const variants = {
  variantPro: '222',
  variantAgency: '333',
};

describe('BillingSyncService', () => {
  let service: BillingSyncService;
  const prisma = createMockPrismaService();

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
      ],
    }).compile();

    service = module.get(BillingSyncService);
  });

  it('maps active event with plan metadata to pro plan', async () => {
    const plan = await service.resolvePlanForEvent(
      {
        eventId: 'whe_1',
        eventType: 'subscription_created',
        subscriptionId: 'sub_1',
        metadata: { user_id: userId, plan: UserPlan.pro },
      },
      SubscriptionStatus.active,
      variants,
    );
    expect(plan).toBe(UserPlan.pro);
  });

  it('resolves plan from variant id when metadata missing', async () => {
    const plan = await service.resolvePlanForEvent(
      {
        eventId: 'whe_2',
        eventType: 'subscription_created',
        subscriptionId: 'sub_1',
        variantId: '222',
        metadata: { user_id: userId },
      },
      SubscriptionStatus.active,
      variants,
    );
    expect(plan).toBe(UserPlan.pro);
  });

  it('syncs active subscription and updates user plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue({ userId });
    prisma.subscription.upsert.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    await service.syncFromSubscriptionEvent(
      {
        eventId: 'whe_3',
        eventType: 'subscription_created',
        subscriptionId: 'sub_1',
        status: 'active',
        renewsAt: '2026-08-26T00:00:00.000000Z',
        metadata: { user_id: userId, plan: UserPlan.pro },
      },
      variants,
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    const upsertCall = prisma.subscription.upsert.mock.calls[0]?.[0];
    expect(upsertCall.update.plan).toBe(UserPlan.pro);
    expect(upsertCall.update.status).toBe(SubscriptionStatus.active);
    const userUpdateCall = prisma.user.update.mock.calls[0]?.[0];
    expect(userUpdateCall.data.plan).toBe(UserPlan.pro);
  });

  it('marks cancel at period end without downgrading plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      userId,
      lemonSubscriptionId: 'sub_1',
      plan: UserPlan.pro,
    });
    prisma.subscription.upsert.mockResolvedValue({});

    await service.handleCancelAtPeriodEnd(
      {
        eventId: 'whe_4',
        eventType: 'subscription_cancelled',
        subscriptionId: 'sub_1',
        endsAt: '2026-08-26T00:00:00.000000Z',
        metadata: { user_id: userId, plan: UserPlan.pro },
      },
      variants,
    );

    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        update: expect.objectContaining({
          cancelAtPeriodEnd: true,
        }),
      }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('downgrades user to free on subscription expired', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      userId,
      lemonSubscriptionId: 'sub_1',
    });

    await service.handleSubscriptionEnded({
      eventId: 'whe_5',
      eventType: 'subscription_expired',
      subscriptionId: 'sub_1',
      metadata: { user_id: userId },
    });

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        data: expect.objectContaining({
          status: SubscriptionStatus.canceled,
          lemonSubscriptionId: null,
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { plan: UserPlan.free },
    });
  });

  it('maps Lemon statuses to subscription statuses', () => {
    expect(service.mapLemonStatus('active', 'subscription_updated')).toBe(
      SubscriptionStatus.active,
    );
    expect(service.mapLemonStatus('paused', 'subscription_paused')).toBe(
      SubscriptionStatus.past_due,
    );
    expect(service.mapLemonStatus('unpaid', 'subscription_updated')).toBe(
      SubscriptionStatus.unpaid,
    );
    expect(service.mapLemonStatus(null, 'order_created')).toBeNull();
  });
});
