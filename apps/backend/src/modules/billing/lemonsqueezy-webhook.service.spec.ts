import { createHash } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingWebhookEventStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';
import { BillingTransactionService } from './billing-transaction.service';
import { LemonsqueezyClientService } from './lemonsqueezy-client.service';
import { LemonsqueezyWebhookService } from './lemonsqueezy-webhook.service';

describe('LemonsqueezyWebhookService', () => {
  let service: LemonsqueezyWebhookService;
  const prisma = createMockPrismaService();
  const billingSync = {
    syncFromSubscriptionEvent: jest.fn(),
  };
  const billingTransactions = {
    grantCreditsFromOrder: jest.fn(),
    recordTransaction: jest.fn(),
    markRefunded: jest.fn(),
    resolveUserId: jest.fn(),
  };

  const lemonClient = {
    isWebhookConfigured: jest.fn().mockReturnValue(true),
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
    getVariantConfig: jest.fn().mockReturnValue({
      variantPro: '222',
      variantAgency: '333',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    lemonClient.isWebhookConfigured.mockReturnValue(true);
    lemonClient.verifyWebhookSignature.mockReturnValue(true);
    prisma.billingWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.billingWebhookEvent.create.mockResolvedValue({});
    prisma.billingWebhookEvent.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LemonsqueezyWebhookService,
        { provide: PrismaService, useValue: prisma },
        { provide: LemonsqueezyClientService, useValue: lemonClient },
        { provide: BillingSyncService, useValue: billingSync },
        { provide: BillingTransactionService, useValue: billingTransactions },
      ],
    }).compile();

    service = module.get(LemonsqueezyWebhookService);
  });

  it('rejects invalid webhook signatures', async () => {
    lemonClient.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).rejects.toThrow(BadRequestException);
  });

  it('skips duplicate processed webhook events', async () => {
    const payload = {
      meta: { event_name: 'subscription_created' },
      data: {
        type: 'subscriptions',
        id: '1',
        attributes: {
          status: 'active',
          updated_at: '2026-07-26T00:00:00.000000Z',
        },
      },
    };
    const raw = Buffer.from(JSON.stringify(payload));
    const eventId = createHash('sha256')
      .update(
        'subscription_created:subscriptions:1:2026-07-26T00:00:00.000000Z:active::',
      )
      .digest('hex')
      .slice(0, 64);

    prisma.billingWebhookEvent.findUnique.mockResolvedValue({
      id: eventId,
      type: 'subscription_created',
      status: BillingWebhookEventStatus.processed,
    });

    const result = await service.handleWebhook(raw, 'sig');

    expect(result).toEqual({ received: true, duplicate: true });
    expect(billingSync.syncFromSubscriptionEvent).not.toHaveBeenCalled();
  });

  it('dispatches subscription created events', async () => {
    const payload = {
      meta: {
        event_name: 'subscription_created',
        custom_data: { user_id: 'user-1', plan: 'pro' },
      },
      data: {
        type: 'subscriptions',
        id: '42',
        attributes: {
          customer_id: 7,
          variant_id: 222,
          status: 'active',
          renews_at: '2026-08-26T00:00:00.000000Z',
          updated_at: '2026-07-26T00:00:00.000000Z',
        },
      },
    };

    await service.handleWebhook(Buffer.from(JSON.stringify(payload)), 'sig');

    expect(billingSync.syncFromSubscriptionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'subscription_created',
        subscriptionId: '42',
        status: 'active',
        metadata: { user_id: 'user-1', plan: 'pro' },
      }),
      expect.any(Object),
    );
  });

  it('grants credits on order_created with credits custom data', async () => {
    billingTransactions.resolveUserId.mockResolvedValue('user-1');

    const payload = {
      meta: {
        event_name: 'order_created',
        custom_data: { user_id: 'user-1', credits: '150' },
      },
      data: {
        type: 'orders',
        id: '99',
        attributes: {
          total: 2550,
          currency: 'USD',
          created_at: '2026-07-26T00:00:00.000000Z',
          user_email: 'a@example.com',
        },
      },
    };

    await service.handleWebhook(Buffer.from(JSON.stringify(payload)), 'sig');

    expect(billingTransactions.grantCreditsFromOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        credits: 150,
        orderId: '99',
        amountCents: 2550,
      }),
    );
  });
});
