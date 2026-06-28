import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import stripeConfig from '../../config/stripe.config';

@Injectable()
export class StripeClientService {
  private readonly client: Stripe | null;

  constructor(
    @Inject(stripeConfig.KEY)
    private readonly config: ConfigType<typeof stripeConfig>,
  ) {
    this.client = config.secretKey ? new Stripe(config.secretKey) : null;
  }

  getClient(): Stripe | null {
    return this.client;
  }

  isCheckoutConfigured(): boolean {
    return Boolean(
      this.client &&
      this.config.priceStarter &&
      this.config.pricePro &&
      this.config.priceAgency,
    );
  }

  isWebhookConfigured(): boolean {
    return Boolean(this.client && this.config.webhookSecret);
  }

  getPriceConfig() {
    return {
      priceStarter: this.config.priceStarter,
      pricePro: this.config.pricePro,
      priceAgency: this.config.priceAgency,
    };
  }

  getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  getWebhookSecret(): string | undefined {
    return this.config.webhookSecret;
  }
}
