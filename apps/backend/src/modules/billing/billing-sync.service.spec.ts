import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionStatus, UserPlan } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { userId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';

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
        eventType: 'subscription.active',
        subscriptionId: 'sub_1',
        metadata: { userId, plan: UserPlan.pro },
      },
      SubscriptionStatus.active,
    );
    expect(plan).toBe(UserPlan.pro);
  });

  it('maps unpaid status to free plan resolution only when not paid status', async () => {
    const plan = await service.resolvePlanForEvent(
      {
        eventId: 'whe_2',
        eventType: 'subscription.cancelled',
        subscriptionId: 'sub_1',
        metadata: { userId, plan: UserPlan.pro },
      },
      SubscriptionStatus.canceled,
    );
    expect(plan).toBe(UserPlan.free);
  });

  it('syncs active subscription and updates user plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue({ userId });
    prisma.subscription.upsert.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});

    await service.syncFromSubscriptionEvent({
      eventId: 'whe_3',
      eventType: 'subscription.active',
      subscriptionId: 'sub_1',
      nextPaymentDate: 1_702_592_000_000,
      metadata: { userId, plan: UserPlan.pro },
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    const upsertCall = prisma.subscription.upsert.mock.calls[0]?.[0];
    expect(upsertCall.update.plan).toBe(UserPlan.pro);
    expect(upsertCall.update.status).toBe(SubscriptionStatus.active);
    const userUpdateCall = prisma.user.update.mock.calls[0]?.[0];
    expect(userUpdateCall.data.plan).toBe(UserPlan.pro);
  });

  it('downgrades user to free on subscription cancelled', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      userId,
      xpaySubscriptionId: 'sub_1',
    });

    await service.handleSubscriptionEnded({
      eventId: 'whe_4',
      eventType: 'subscription.cancelled',
      subscriptionId: 'sub_1',
      metadata: { userId },
    });

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
        data: expect.objectContaining({
          status: SubscriptionStatus.canceled,
          xpaySubscriptionId: null,
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { plan: UserPlan.free },
    });
  });

  it('maps event types to subscription statuses', () => {
    expect(service.mapEventToStatus('subscription.active')).toBe(
      SubscriptionStatus.active,
    );
    expect(service.mapEventToStatus('subscription.paused')).toBe(
      SubscriptionStatus.past_due,
    );
    expect(service.mapEventToStatus('subscription.unpaid')).toBe(
      SubscriptionStatus.unpaid,
    );
    expect(service.mapEventToStatus('intent.success')).toBeNull();
  });
});
