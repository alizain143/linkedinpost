import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { escapeHtml } from '../notifications/email-template';
import { ResendEmailSender } from '../notifications/senders/resend-email.sender';
import {
  SubmitContactDto,
  SubmitContactResponseDto,
} from './dto/submit-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailSender: ResendEmailSender,
  ) {}

  async submit(dto: SubmitContactDto): Promise<SubmitContactResponseDto> {
    if (!this.emailSender.isConfigured()) {
      throw new ServiceUnavailableException({
        error: 'Contact form is temporarily unavailable',
        code: 'CONTACT_UNAVAILABLE',
      });
    }

    const to = this.configService.get<string>('resend.contactToEmail');
    if (!to) {
      throw new ServiceUnavailableException({
        error: 'Contact form is temporarily unavailable',
        code: 'CONTACT_UNAVAILABLE',
      });
    }

    const name = [dto.firstName?.trim(), dto.lastName?.trim()]
      .filter(Boolean)
      .join(' ');
    const displayName = name || 'Anonymous';
    const subject = `[Contact] ${dto.subject} — ${displayName}`;

    const text = [
      `New contact form submission`,
      '',
      `From: ${displayName} <${dto.email}>`,
      `Subject: ${dto.subject}`,
      '',
      dto.message.trim(),
    ].join('\n');

    const html = `
      <p><strong>New contact form submission</strong></p>
      <p>
        <strong>From:</strong> ${escapeHtml(displayName)}
        &lt;${escapeHtml(dto.email)}&gt;<br />
        <strong>Subject:</strong> ${escapeHtml(dto.subject)}
      </p>
      <p style="white-space:pre-wrap">${escapeHtml(dto.message.trim())}</p>
    `.trim();

    try {
      const providerId = await this.emailSender.sendRaw({
        to,
        subject,
        html,
        text,
        replyTo: dto.email,
        tags: [
          { name: 'type', value: 'contact' },
          { name: 'subject', value: slugTag(dto.subject) },
        ],
      });

      if (!providerId) {
        throw new ServiceUnavailableException({
          error: 'Contact form is temporarily unavailable',
          code: 'CONTACT_UNAVAILABLE',
        });
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Failed to send contact email: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new ServiceUnavailableException({
        error: 'Failed to send your message. Please try again shortly.',
        code: 'CONTACT_SEND_FAILED',
      });
    }

    return { sent: true };
  }
}

function slugTag(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}
