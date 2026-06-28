import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreditTransactionType, UserPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildUser, userId } from '../../test/fixtures';
import { createMockPrismaService } from '../../test/prisma.mock';
import { CreditsService } from './credits.service';

describe('CreditsService', () => {
  let service: CreditsService;
  const prisma = createMockPrismaService();
  const now = new Date('2026-06-27T12:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      ...buildUser({ plan: UserPlan.pro }),
      subscription: null,
    });
    prisma.creditTransaction.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    prisma.creditTransaction.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CreditsService);
  });

  describe('getBalance', () => {
    it('returns zero used when no transactions exist', async () => {
      const result = await service.getBalance(userId, now);

      expect(result.plan).toBe(UserPlan.pro);
      expect(result.used).toBe(0);
      expect(result.limit).toBe(200);
      expect(result.remaining).toBe(200);
      expect(result.percentUsed).toBe(0);
      expect(result.periodStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    });

    it('sums negative transactions in the current UTC month', async () => {
      prisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { amount: -7 },
      });

      const result = await service.getBalance(userId, now);

      expect(result.used).toBe(7);
      expect(result.remaining).toBe(193);
      expect(result.percentUsed).toBe(4);
    });
  });

  describe('assertHasCredits', () => {
    it('throws CREDITS_EXHAUSTED when remaining is insufficient', async () => {
      prisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { amount: -200 },
      });

      await expect(service.assertHasCredits(userId, 1)).rejects.toMatchObject({
        status: HttpStatus.PAYMENT_REQUIRED,
        response: expect.objectContaining({ code: 'CREDITS_EXHAUSTED' }),
      });
    });
  });

  describe('consume', () => {
    it('records a negative transaction and returns updated balance', async () => {
      prisma.$transaction.mockImplementation(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }
        return Promise.all(arg as Promise<unknown>[]);
      });
      prisma.creditTransaction.aggregate.mockResolvedValue({
        _sum: { amount: -2 },
      });

      const result = await service.consume(
        userId,
        1,
        CreditTransactionType.generation,
        { reason: 'quick draft', generationJobId: 'job-1' },
      );

      expect(prisma.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId,
          generationJobId: 'job-1',
          amount: -1,
          type: CreditTransactionType.generation,
          reason: 'quick draft',
        },
      });
      expect(result.used).toBe(3);
      expect(result.remaining).toBe(197);
    });

    it('rejects non-positive cost', async () => {
      await expect(
        service.consume(userId, 0, CreditTransactionType.generation),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });
});
