import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import lemonsqueezyConfig from '../../config/lemonsqueezy.config';
import type { LemonVariantConfig } from '../../common/constants/billing-plan.map';

export interface CreateLemonCheckoutInput {
  variantId: string;
  email: string;
  name?: string;
  custom: Record<string, string>;
  redirectUrl: string;
  customPriceCents?: number;
  receiptThankYouNote?: string;
}

export interface CreateLemonCheckoutResponse {
  url: string;
  checkoutId: string;
}

@Injectable()
export class LemonsqueezyClientService {
  private readonly logger = new Logger(LemonsqueezyClientService.name);

  constructor(
    @Inject(lemonsqueezyConfig.KEY)
    private readonly config: ConfigType<typeof lemonsqueezyConfig>,
  ) {}

  isCheckoutConfigured(): boolean {
    return Boolean(
      this.config.apiKey &&
        this.config.storeId &&
        this.config.variantStarter &&
        this.config.variantPro &&
        this.config.variantAgency,
    );
  }

  isCreditsCheckoutConfigured(): boolean {
    return Boolean(
      this.config.apiKey && this.config.storeId && this.config.variantCredits,
    );
  }

  isWebhookConfigured(): boolean {
    return Boolean(this.config.webhookSecret);
  }

  getVariantConfig(): LemonVariantConfig {
    return {
      variantStarter: this.config.variantStarter,
      variantPro: this.config.variantPro,
      variantAgency: this.config.variantAgency,
    };
  }

  getCreditsVariantId(): string | undefined {
    return this.config.variantCredits;
  }

  getFrontendUrl(): string {
    return this.config.frontendUrl;
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.webhookSecret;
    if (!secret) {
      return false;
    }

    const digest = createHmac('sha256', secret).update(rawBody).digest('hex');

    try {
      const expected = Buffer.from(digest, 'utf8');
      const received = Buffer.from(signature, 'utf8');
      if (expected.length !== received.length) {
        return false;
      }
      return timingSafeEqual(expected, received);
    } catch {
      return false;
    }
  }

  async createCheckout(
    input: CreateLemonCheckoutInput,
  ): Promise<CreateLemonCheckoutResponse> {
    const storeId = this.config.storeId;
    if (!storeId) {
      throw new ServiceUnavailableException({
        error: 'Billing is not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    const attributes: Record<string, unknown> = {
      checkout_data: {
        email: input.email,
        name: input.name,
        custom: input.custom,
      },
      product_options: {
        redirect_url: input.redirectUrl,
        ...(input.receiptThankYouNote
          ? { receipt_thank_you_note: input.receiptThankYouNote }
          : {}),
      },
    };

    if (input.customPriceCents != null) {
      attributes.custom_price = input.customPriceCents;
    }

    const response = await this.request<{
      data?: {
        id?: string;
        attributes?: { url?: string };
      };
    }>('POST', '/v1/checkouts', {
      data: {
        type: 'checkouts',
        attributes,
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(input.variantId),
            },
          },
        },
      },
    });

    const url = response.data?.attributes?.url;
    const checkoutId = response.data?.id;

    if (!url || !checkoutId) {
      throw new ServiceUnavailableException({
        error: 'Failed to create checkout session',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    return { url, checkoutId };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.request('PATCH', `/v1/subscriptions/${subscriptionId}`, {
      data: {
        type: 'subscriptions',
        id: String(subscriptionId),
        attributes: {
          cancelled: true,
        },
      },
    });
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const apiKey = this.config.apiKey;
    if (!apiKey) {
      throw new ServiceUnavailableException({
        error: 'Billing is not available',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    const url = `${this.config.apiBaseUrl.replace(/\/$/, '')}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      this.logger.error(
        `Lemon Squeezy request failed: ${method} ${path}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException({
        error: 'Billing provider unreachable',
        code: 'BILLING_UNAVAILABLE',
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(
        `Lemon Squeezy error ${response.status} ${method} ${path}: ${text}`,
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
