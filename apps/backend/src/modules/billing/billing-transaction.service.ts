import { Injectable, Logger } from '@nestjs/common';
import {
  BillingTransactionStatus,
  BillingTransactionType,
  CreditTransactionType,
  UserPlan,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditsService } from '../credits/credits.service';

export interface RecordBillingTransactionInput {
  userId: string;
  type: BillingTransactionType;
  status: BillingTransactionStatus;
  amountCents: number;
  currency?: string;
  description?: string | null;
  creditsGranted?: number | null;
  plan?: UserPlan | null;
  providerEventId: string;
  providerOrderId?: string | null;
  providerInvoiceId?: string | null;
  occurredAt: Date;
}

@Injectable()
export class BillingTransactionService {
  private readonly logger = new Logger(BillingTransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditsService: CreditsService,
  ) {}

  async recordTransaction(
    input: RecordBillingTransactionInput,
  ): Promise<boolean> {
    const existing = await this.prisma.billingTransaction.findUnique({
      where: { providerEventId: input.providerEventId },
    });
    if (existing) {
      return false;
    }

    try {
      await this.prisma.billingTransaction.create({
        data: {
          userId: input.userId,
          type: input.type,
          status: input.status,
          amountCents: input.amountCents,
          currency: input.currency ?? 'USD',
          description: input.description ?? null,
          creditsGranted: input.creditsGranted ?? null,
          plan: input.plan ?? null,
          providerEventId: input.providerEventId,
          providerOrderId: input.providerOrderId ?? null,
          providerInvoiceId: input.providerInvoiceId ?? null,
          occurredAt: input.occurredAt,
        },
      });
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async markRefunded(params: {
    providerEventId: string;
    providerOrderId?: string | null;
    providerInvoiceId?: string | null;
    userId?: string | null;
    amountCents?: number | null;
    currency?: string | null;
    occurredAt: Date;
  }): Promise<void> {
    const match = await this.prisma.billingTransaction.findFirst({
      where: {
        OR: [
          params.providerOrderId
            ? { providerOrderId: params.providerOrderId }
            : undefined,
          params.providerInvoiceId
            ? { providerInvoiceId: params.providerInvoiceId }
            : undefined,
        ].filter(Boolean) as Array<{
          providerOrderId?: string;
          providerInvoiceId?: string;
        }>,
      },
      orderBy: { occurredAt: 'desc' },
    });

    if (match) {
      await this.prisma.billingTransaction.update({
        where: { id: match.id },
        data: { status: BillingTransactionStatus.refunded },
      });
      return;
    }

    if (!params.userId) {
      this.logger.warn('Refund event without matching transaction or user');
      return;
    }

    await this.recordTransaction({
      userId: params.userId,
      type: BillingTransactionType.refund,
      status: BillingTransactionStatus.refunded,
      amountCents: params.amountCents ?? 0,
      currency: params.currency ?? 'USD',
      description: 'Refund',
      providerEventId: params.providerEventId,
      providerOrderId: params.providerOrderId,
      providerInvoiceId: params.providerInvoiceId,
      occurredAt: params.occurredAt,
    });
  }

  async grantCreditsFromOrder(params: {
    userId: string;
    credits: number;
    orderId: string;
    amountCents: number;
    currency: string;
    providerEventId: string;
    occurredAt: Date;
  }): Promise<void> {
    await this.creditsService.grant(
      params.userId,
      params.credits,
      CreditTransactionType.purchase,
      {
        reason: `Lemon order ${params.orderId}`,
        providerRef: `lemon_order:${params.orderId}`,
      },
    );

    await this.recordTransaction({
      userId: params.userId,
      type: BillingTransactionType.credit_purchase,
      status: BillingTransactionStatus.paid,
      amountCents: params.amountCents,
      currency: params.currency,
      description: `Credit top-up · ${params.credits} credits`,
      creditsGranted: params.credits,
      providerEventId: params.providerEventId,
      providerOrderId: params.orderId,
      occurredAt: params.occurredAt,
    });
  }

  async resolveUserId(params: {
    userId?: string | null;
    lemonCustomerId?: string | null;
    lemonSubscriptionId?: string | null;
    email?: string | null;
  }): Promise<string | null> {
    if (params.userId) {
      return params.userId;
    }

    if (params.lemonSubscriptionId) {
      const sub = await this.prisma.subscription.findUnique({
        where: { lemonSubscriptionId: params.lemonSubscriptionId },
      });
      if (sub) return sub.userId;
    }

    if (params.lemonCustomerId) {
      const sub = await this.prisma.subscription.findUnique({
        where: { lemonCustomerId: params.lemonCustomerId },
      });
      if (sub) return sub.userId;
    }

    if (params.email) {
      const user = await this.prisma.user.findFirst({
        where: { email: params.email, deletedAt: null },
      });
      if (user) return user.id;
    }

    return null;
  }
}
