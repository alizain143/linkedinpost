import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import xpayConfig from '../../config/xpay.config';
import type { XpayAmountConfig } from '../../common/constants/xpay-plan.map';

export interface XpayCustomerDetails {
  name: string;
  email: string;
  contactNumber: string;
}

export interface CreateXpaySubscriptionInput {
  amount: number;
  currency: string;
  customerDetails: XpayCustomerDetails;
  callbackUrl: string;
  cancelUrl: string;
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  intervalCount: number;
  cycleCount: number;
  metadata: Record<string, string>;
  productPage: { name: string; description?: string };
  customerId?: string;
}

export interface CreateXpaySubscriptionResponse {
  subscriptionId: string;
  createdAt?: string;
  fwdUrl: string;
}

@Injectable()
export class XpayClientService {
  private readonly logger = new Logger(XpayClientService.name);

  constructor(
    @Inject(xpayConfig.KEY)
    private readonly config: ConfigType<typeof xpayConfig>,
  ) {}

  isCheckoutConfigured(): boolean {
    return Boolean(
      this.config.publicKey &&
        this.config.privateKey &&
        this.config.amountStarter &&
        this.config.amountPro &&
        this.config.amountAgency,
    );
  }

  isWebhookConfigured(): boolean {
    return Boolean(this.config.webhookSecret);
  }

  getAmountConfig(): XpayAmountConfig {
    return {
      amountStarter: this.config.amountStarter,
      amountPro: this.config.amountPro,
      amountAgency: this.config.amountAgency,
    };
  }

  getCurrency(): string {
    return this.config.currency;
  }

  getCycleCount(): number {
    return this.config.cycleCount;
  }

  getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  getWebhookSecret(): string | undefined {
    return this.config.webhookSecret;
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.webhookSecret;
    if (!secret) {
      return false;
    }

    const expected = createHmac('sha512', secret)
      .update(rawBody)
      .digest('base64');

    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return timingSafeEqual(expectedBuf, signatureBuf);
  }

  async createSubscription(
    input: CreateXpaySubscriptionInput,
  ): Promise<CreateXpaySubscriptionResponse> {
    const response = await this.request<CreateXpaySubscriptionResponse>(
      'POST',
      '/subscription/create',
      input,
    );

    if (!response.subscriptionId || !response.fwdUrl) {
      throw new ServiceUnavailableException({
        error: 'Failed to create checkout session',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    return response;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request('POST', '/subscription/merchant/cancel', {
      subscriptionId,
    });
  }

  private async request<T>(
    method: 'POST' | 'GET',
    path: string,
    body?: unknown,
  ): Promise<T> {
    if (!this.config.publicKey || !this.config.privateKey) {
      throw new ServiceUnavailableException({
        error: 'Billing is not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    const credentials = Buffer.from(
      `${this.config.publicKey}:${this.config.privateKey}`,
    ).toString('base64');

    const url = `${this.config.apiBaseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      this.logger.error(`XPay request failed: ${path}`, error);
      throw new ServiceUnavailableException({
        error: 'Billing provider unreachable',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      this.logger.error(
        `XPay ${method} ${path} failed (${response.status}): ${errorText}`,
      );
      throw new ServiceUnavailableException({
        error: 'Billing provider error',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
