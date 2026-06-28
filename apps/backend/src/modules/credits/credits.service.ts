import {
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
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
  remaining: number;
  percentUsed: number;
}

export interface ConsumeCreditsOptions {
  generationJobId?: string;
  reason?: string;
}

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
    const limit = getCreditLimitForPlan(user.plan);
    const remaining = Math.max(0, limit - used);
    const percentUsed =
      limit > 0 ? Math.round((used / limit) * 100) : 0;

    return {
      plan: user.plan,
      periodStart,
      periodEnd,
      used,
      limit,
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
      const limit = getCreditLimitForPlan(user.plan);
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
        remaining: nextRemaining,
        percentUsed:
          limit > 0 ? Math.round((nextUsed / limit) * 100) : 0,
      };
    });
  }

  async grant(
    userId: string,
    amount: number,
    type: CreditTransactionType = CreditTransactionType.adjustment,
    reason?: string,
  ): Promise<CreditsBalance> {
    if (amount <= 0) {
      throw new HttpException(
        {
          error: 'Grant amount must be positive',
          code: 'VALIDATION_ERROR',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        reason: reason ?? null,
      },
    });

    return this.getBalance(userId);
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
}
