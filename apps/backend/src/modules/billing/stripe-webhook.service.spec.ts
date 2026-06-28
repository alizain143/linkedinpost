import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookEventStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingSyncService } from './billing-sync.service';
import { StripeClientService } from './stripe-client.service';
import { StripeWebhookService } from './stripe-webhook.service';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  const prisma = createMockPrismaService();
  const billingSync = {
    syncFromCheckoutSession: jest.fn(),
    syncFromStripeSubscription: jest.fn(),
    handleSubscriptionDeleted: jest.fn(),
    handlePaymentFailed: jest.fn(),
    syncFromInvoicePayment: jest.fn(),
  };

  const constructEvent = jest.fn();
  const stripeClient = {
    getClient: jest.fn().mockReturnValue({
      webhooks: { constructEvent },
    }),
    getWebhookSecret: jest.fn().mockReturnValue('whsec_test'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.stripeWebhookEvent.create.mockResolvedValue({});
    prisma.stripeWebhookEvent.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: PrismaService, useValue: prisma },
        { provide: StripeClientService, useValue: stripeClient },
        { provide: BillingSyncService, useValue: billingSync },
      ],
    }).compile();

    service = module.get(StripeWebhookService);
  });

  it('rejects invalid webhook signatures', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    await expect(
      service.handleWebhook(Buffer.from('{}'), 'sig'),
    ).rejects.toThrow(BadRequestException);
  });

  it('skips duplicate processed webhook events', async () => {
    constructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1' } },
    });
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue({
      id: 'evt_1',
      type: 'customer.subscription.updated',
      status: StripeWebhookEventStatus.processed,
    });

    const result = await service.handleWebhook(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true, duplicate: true });
    expect(billingSync.syncFromStripeSubscription).not.toHaveBeenCalled();
  });

  it('dispatches subscription updated events', async () => {
    const subscription = { id: 'sub_1' };
    constructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'customer.subscription.updated',
      data: { object: subscription },
    });

    await service.handleWebhook(Buffer.from('{}'), 'sig');

    expect(prisma.stripeWebhookEvent.create).toHaveBeenCalledWith({
      data: {
        id: 'evt_2',
        type: 'customer.subscription.updated',
        status: StripeWebhookEventStatus.pending,
      },
    });
    expect(billingSync.syncFromStripeSubscription).toHaveBeenCalledWith(
      subscription,
    );
    expect(prisma.stripeWebhookEvent.update).toHaveBeenCalledWith({
      where: { id: 'evt_2' },
      data: {
        status: StripeWebhookEventStatus.processed,
        processedAt: expect.any(Date),
        errorMessage: null,
      },
    });
  });
});
