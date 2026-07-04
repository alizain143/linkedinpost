import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingWebhookEventStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';
import { XpayClientService } from './xpay-client.service';
import { XpayWebhookService } from './xpay-webhook.service';

describe('XpayWebhookService', () => {
  let service: XpayWebhookService;
  const prisma = createMockPrismaService();
  const billingSync = {
    syncFromSubscriptionEvent: jest.fn(),
  };

  const xpayClient = {
    isWebhookConfigured: jest.fn().mockReturnValue(true),
    verifyWebhookSignature: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    xpayClient.isWebhookConfigured.mockReturnValue(true);
    xpayClient.verifyWebhookSignature.mockReturnValue(true);
    prisma.billingWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.billingWebhookEvent.create.mockResolvedValue({});
    prisma.billingWebhookEvent.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpayWebhookService,
        { provide: PrismaService, useValue: prisma },
        { provide: XpayClientService, useValue: xpayClient },
        { provide: BillingSyncService, useValue: billingSync },
      ],
    }).compile();

    service = module.get(XpayWebhookService);
  });

  it('rejects invalid webhook signatures', async () => {
    xpayClient.verifyWebhookSignature.mockReturnValue(false);

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).rejects.toThrow(BadRequestException);
  });

  it('skips duplicate processed webhook events', async () => {
    const payload = {
      eventId: 'whe_1',
      eventType: 'subscription.active',
      subscriptionId: 'sub_1',
    };
    prisma.billingWebhookEvent.findUnique.mockResolvedValue({
      id: 'whe_1',
      type: 'subscription.active',
      status: BillingWebhookEventStatus.processed,
    });

    const result = await service.handleWebhook(
      Buffer.from(JSON.stringify(payload)),
      'sig',
    );

    expect(result).toEqual({ received: true, duplicate: true });
    expect(billingSync.syncFromSubscriptionEvent).not.toHaveBeenCalled();
  });

  it('dispatches subscription active events', async () => {
    const payload = {
      eventId: 'whe_2',
      eventType: 'subscription.active',
      subscriptionId: 'sub_1',
      metadata: { userId: 'user-1', plan: 'pro' },
    };

    await service.handleWebhook(Buffer.from(JSON.stringify(payload)), 'sig');

    expect(prisma.billingWebhookEvent.create).toHaveBeenCalledWith({
      data: {
        id: 'whe_2',
        type: 'subscription.active',
        status: BillingWebhookEventStatus.pending,
      },
    });
    expect(billingSync.syncFromSubscriptionEvent).toHaveBeenCalledWith(payload);
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'whe_2' },
      data: {
        status: BillingWebhookEventStatus.processed,
        processedAt: expect.any(Date),
        errorMessage: null,
      },
    });
  });
});
