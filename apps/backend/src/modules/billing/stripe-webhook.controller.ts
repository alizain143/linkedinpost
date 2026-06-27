import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('billing')
@Controller('billing/webhooks')
export class StripeWebhookController {
  constructor(private readonly stripeWebhookService: StripeWebhookService) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook receiver (signature-verified)' })
  @ApiHeader({ name: 'stripe-signature', required: true })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException({
        error: 'Missing request body',
        code: 'WEBHOOK_INVALID',
      });
    }

    return this.stripeWebhookService.handleWebhook(rawBody, signature);
  }
}
