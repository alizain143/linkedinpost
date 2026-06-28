import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeClientService } from './stripe-client.service';

@Injectable()
export class StripeCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClientService,
  ) {}

  async getOrCreateStripeCustomer(user: User): Promise<string> {
    const existing = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existing?.stripeCustomerId) {
      return existing.stripeCustomerId;
    }

    const stripe = this.stripeClient.getClient();
    if (!stripe) {
      throw new Error('Stripe client not configured');
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });

      await this.prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customer.id,
        },
        update: {
          stripeCustomerId: customer.id,
        },
      });

      return customer.id;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const raced = await this.prisma.subscription.findUnique({
          where: { userId: user.id },
        });
        if (raced?.stripeCustomerId) {
          return raced.stripeCustomerId;
        }
      }

      throw error;
    }
  }
}
