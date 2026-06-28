import { Prisma } from '@prisma/client';
import { buildUser } from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { StripeCustomerService } from './stripe-customer.service';
import { StripeClientService } from './stripe-client.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('StripeCustomerService', () => {
  const prisma = createMockPrismaService();
  const stripeClient = {
    getClient: jest.fn(),
  };
  let service: StripeCustomerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StripeCustomerService(
      prisma as unknown as PrismaService,
      stripeClient as unknown as StripeClientService,
    );
  });

  it('returns existing stripe customer id without creating', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_existing',
    });

    const customerId = await service.getOrCreateStripeCustomer(buildUser());

    expect(customerId).toBe('cus_existing');
    expect(stripeClient.getClient).not.toHaveBeenCalled();
  });

  it('recovers from P2002 race by re-reading subscription', async () => {
    prisma.subscription.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ stripeCustomerId: 'cus_raced' });
    stripeClient.getClient.mockReturnValue({
      customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_new' }),
      },
    });
    prisma.subscription.upsert.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const customerId = await service.getOrCreateStripeCustomer(buildUser());

    expect(customerId).toBe('cus_raced');
  });
});
