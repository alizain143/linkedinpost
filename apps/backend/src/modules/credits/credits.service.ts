import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreditTransactionType, UserPlan } from '@prisma/client';
import { getCreditLimitForPlan } from '../../common/constants/plan.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveCreditPeriod } from './credits-period.util';

export interface CreditsBalance {
  plan: UserPlan;
  periodStart: Date;
  periodEnd: Date;
  used: number;
  limit: number;
  purchased: number;
  remaining: number;
  percentUsed: number;
}

export interface ConsumeCreditsOptions {
  generationJobId?: string;
  reason?: string;
}

export interface GrantCreditsOptions {
  reason?: string;
  providerRef?: string;
}

type TransactionClient = Pick<
  PrismaService,
  'user' | 'creditTransaction' | '$executeRaw'
>;

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string, now = new Date()): Promise<CreditsBalance> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true },
    });

    const { periodStart, periodEnd } = resolveCreditPeriod(
      user.subscription,
      now,
    );
    const used = await this.getUsedCredits(userId, periodStart, periodEnd);
    const purchased = await this.getPurchasedCredits(
      userId,
      periodStart,
      periodEnd,
    );
    const planLimit = getCreditLimitForPlan(user.plan);
    const limit = planLimit + purchased;
    const remaining = Math.max(0, limit - used);
    const percentUsed = limit > 0 ? Math.round((used / limit) * 100) : 0;

    return {
      plan: user.plan,
      periodStart,
      periodEnd,
      used,
      limit,
      purchased,
      remaining,
      percentUsed,
    };
  }

  async assertHasCredits(userId: string, cost: number): Promise<void> {
    const balance = await this.getBalance(userId);

    if (balance.remaining < cost) {
      throw new HttpException(
        {
          error: 'Insufficient credits',
          code: 'CREDITS_EXHAUSTED',
          detail: {
            used: balance.used,
            limit: balance.limit,
            remaining: balance.remaining,
            cost,
          },
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async consume(
    userId: string,
    cost: number,
    type: CreditTransactionType,
    options?: ConsumeCreditsOptions | string,
  ): Promise<CreditsBalance> {
    const normalizedOptions: ConsumeCreditsOptions =
      typeof options === 'string' ? { reason: options } : (options ?? {});

    if (cost <= 0) {
      throw new HttpException(
        {
          error: 'Credit cost must be positive',
          code: 'VALIDATION_ERROR',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.lockUserForCredits(userId, tx);

      if (normalizedOptions.generationJobId) {
        const existing = await tx.creditTransaction.findFirst({
          where: {
            generationJobId: normalizedOptions.generationJobId,
            type,
          },
        });

        if (existing) {
          return this.buildBalanceFromLockedUser(userId, tx);
        }
      }

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { subscription: true },
      });
      const now = new Date();
      const { periodStart, periodEnd } = resolveCreditPeriod(
        user.subscription,
        now,
      );
      const used = await this.getUsedCredits(
        userId,
        periodStart,
        periodEnd,
        tx,
      );
      const purchased = await this.getPurchasedCredits(
        userId,
        periodStart,
        periodEnd,
        tx,
      );
      const planLimit = getCreditLimitForPlan(user.plan);
      const limit = planLimit + purchased;
      const remaining = Math.max(0, limit - used);

      if (remaining < cost) {
        throw new HttpException(
          {
            error: 'Insufficient credits',
            code: 'CREDITS_EXHAUSTED',
            detail: { used, limit, remaining, cost },
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      await tx.creditTransaction.create({
        data: {
          userId,
          generationJobId: normalizedOptions.generationJobId ?? null,
          amount: -cost,
          type,
          reason: normalizedOptions.reason ?? null,
        },
      });

      const nextUsed = used + cost;
      const nextRemaining = Math.max(0, limit - nextUsed);

      return {
        plan: user.plan,
        periodStart,
        periodEnd,
        used: nextUsed,
        limit,
        purchased,
        remaining: nextRemaining,
        percentUsed: limit > 0 ? Math.round((nextUsed / limit) * 100) : 0,
      };
    });
  }

  async grant(
    userId: string,
    amount: number,
    type: CreditTransactionType = CreditTransactionType.adjustment,
    options?: GrantCreditsOptions | string,
  ): Promise<CreditsBalance> {
    const normalized: GrantCreditsOptions =
      typeof options === 'string' ? { reason: options } : (options ?? {});

    if (amount <= 0) {
      throw new HttpException(
        {
          error: 'Grant amount must be positive',
          code: 'VALIDATION_ERROR',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (normalized.providerRef) {
      const existing = await this.prisma.creditTransaction.findUnique({
        where: { providerRef: normalized.providerRef },
      });
      if (existing) {
        return this.getBalance(userId);
      }
    }

    try {
      await this.prisma.creditTransaction.create({
        data: {
          userId,
          amount,
          type,
          reason: normalized.reason ?? null,
          providerRef: normalized.providerRef ?? null,
        },
      });
    } catch (error) {
      // Unique providerRef race — treat as idempotent success
      if (
        normalized.providerRef &&
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return this.getBalance(userId);
      }
      throw error;
    }

    return this.getBalance(userId);
  }

  private async lockUserForCredits(
    userId: string,
    tx: TransactionClient,
  ): Promise<void> {
    await tx.$executeRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
  }

  private async buildBalanceFromLockedUser(
    userId: string,
    tx: TransactionClient,
  ): Promise<CreditsBalance> {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: { subscription: true },
    });
    const now = new Date();
    const { periodStart, periodEnd } = resolveCreditPeriod(
      user.subscription,
      now,
    );
    const used = await this.getUsedCredits(userId, periodStart, periodEnd, tx);
    const purchased = await this.getPurchasedCredits(
      userId,
      periodStart,
      periodEnd,
      tx,
    );
    const planLimit = getCreditLimitForPlan(user.plan);
    const limit = planLimit + purchased;
    const remaining = Math.max(0, limit - used);

    return {
      plan: user.plan,
      periodStart,
      periodEnd,
      used,
      limit,
      purchased,
      remaining,
      percentUsed: limit > 0 ? Math.round((used / limit) * 100) : 0,
    };
  }

  private async getUsedCredits(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    prisma: Pick<PrismaService, 'creditTransaction'> = this.prisma,
  ): Promise<number> {
    const aggregate = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        amount: { lt: 0 },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      _sum: { amount: true },
    });

    return Math.abs(aggregate._sum.amount ?? 0);
  }

  private async getPurchasedCredits(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
    prisma: Pick<PrismaService, 'creditTransaction'> = this.prisma,
  ): Promise<number> {
    const aggregate = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: CreditTransactionType.purchase,
        amount: { gt: 0 },
        createdAt: { gte: periodStart, lt: periodEnd },
      },
      _sum: { amount: true },
    });

    return aggregate._sum.amount ?? 0;
  }
}
