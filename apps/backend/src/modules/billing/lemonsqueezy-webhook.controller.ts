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
import { LemonsqueezyWebhookService } from './lemonsqueezy-webhook.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('billing')
@Controller('billing/webhooks')
export class LemonsqueezyWebhookController {
  constructor(
    private readonly lemonsqueezyWebhookService: LemonsqueezyWebhookService,
  ) {}

  @Post('lemonsqueezy')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Lemon Squeezy webhook receiver (signature-verified)',
  })
  @ApiHeader({ name: 'x-signature', required: true })
  async handleLemonsqueezyWebhook(
    @Req() req: RawBodyRequest,
    @Headers('x-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new BadRequestException({
        error: 'Missing request body',
        code: 'WEBHOOK_INVALID',
      });
    }

    return this.lemonsqueezyWebhookService.handleWebhook(rawBody, signature);
  }
}
