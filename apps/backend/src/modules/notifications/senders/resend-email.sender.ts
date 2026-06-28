import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { buildEmailHtml, buildEmailText } from '../email-template';
import { buildEmailSubject } from '../notification-copy';

export interface SendEmailParams {
  to: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
}

@Injectable()
export class ResendEmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly client: Resend | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.client = apiKey ? new Resend(apiKey) : null;
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  async send(params: SendEmailParams): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('Resend not configured; skipping email send');
      return null;
    }

    const fromEmail = this.configService.get<string>('resend.fromEmail');
    const frontendUrl =
      this.configService.get<string>('resend.frontendUrl') ??
      'http://localhost:3000';

    if (!fromEmail) {
      this.logger.warn('RESEND_FROM_EMAIL not configured; skipping email send');
      return null;
    }

    const subject = buildEmailSubject(params.type as never);
    const html = buildEmailHtml({
      type: params.type as never,
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
      frontendUrl,
    });

    const text = buildEmailText({
      type: params.type as never,
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
      frontendUrl,
    });

    const payload = {
      from: fromEmail,
      to: params.to,
      subject,
      html,
      text,
      tags: [{ name: 'type', value: params.type }],
    };

    let lastError: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await this.client.emails.send(payload);

      if (!result.error) {
        return result.data?.id ?? null;
      }

      lastError = result.error.message;
      const retryable = isRetryableResendError(lastError);

      if (!retryable || attempt === 3) {
        throw new Error(lastError);
      }

      await sleep(attempt * 500);
    }

    throw new Error(lastError ?? 'Resend send failed');
  }
}

function isRetryableResendError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('could not be resolved') ||
    normalized.includes('unable to fetch') ||
    normalized.includes('econnreset') ||
    normalized.includes('etimedout') ||
    normalized.includes('network')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
