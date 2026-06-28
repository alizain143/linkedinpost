import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  buildEmailHtml,
  buildEmailSubject,
} from '../notification-copy';

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
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
      frontendUrl,
    });

    const result = await this.client.emails.send({
      from: fromEmail,
      to: params.to,
      subject,
      html,
      text: `${params.title}\n\n${params.body}${
        params.actionUrl ? `\n\n${params.actionUrl}` : ''
      }`,
      tags: [{ name: 'type', value: params.type }],
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.data?.id ?? null;
  }
}
