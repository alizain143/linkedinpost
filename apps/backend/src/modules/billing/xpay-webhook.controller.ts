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
import { XpayWebhookService } from './xpay-webhook.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('billing')
@Controller('billing/webhooks')
export class XpayWebhookController {
  constructor(private readonly xpayWebhookService: XpayWebhookService) {}

  @Post('xpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'XPay webhook receiver (signature-verified)' })
  @ApiHeader({ name: 'xpay-signature', required: true })
  async handleXpayWebhook(
    @Req() req: RawBodyRequest,
    @Headers('xpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException({
        error: 'Missing request body',
        code: 'WEBHOOK_INVALID',
      });
    }

    return this.xpayWebhookService.handleWebhook(rawBody, signature);
  }
}
