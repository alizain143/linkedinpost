import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactService } from './contact.service';
import { ResendEmailSender } from '../notifications/senders/resend-email.sender';

describe('ContactService', () => {
  const emailSender = {
    isConfigured: jest.fn(),
    sendRaw: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  let service: ContactService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      if (key === 'resend.contactToEmail') return 'hello@linkedinpost.ai';
      return undefined;
    });
    emailSender.isConfigured.mockReturnValue(true);
    emailSender.sendRaw.mockResolvedValue('email_123');

    service = new ContactService(
      configService as unknown as ConfigService,
      emailSender as unknown as ResendEmailSender,
    );
  });

  it('sends a contact email with reply-to set to the submitter', async () => {
    const result = await service.submit({
      firstName: 'Maya',
      lastName: 'Reyes',
      email: 'maya@company.com',
      subject: 'General question',
      message: 'I have a question about the product.',
    });

    expect(result).toEqual({ sent: true });
    expect(emailSender.sendRaw).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'hello@linkedinpost.ai',
        replyTo: 'maya@company.com',
        subject: '[Contact] General question — Maya Reyes',
      }),
    );
  });

  it('throws CONTACT_UNAVAILABLE when Resend is not configured', async () => {
    emailSender.isConfigured.mockReturnValue(false);

    await expect(
      service.submit({
        email: 'maya@company.com',
        subject: 'Press',
        message: 'Press inquiry about linkedinpost.ai',
      }),
    ).rejects.toMatchObject({
      response: { code: 'CONTACT_UNAVAILABLE' },
    });
    expect(emailSender.sendRaw).not.toHaveBeenCalled();
  });

  it('throws CONTACT_SEND_FAILED when Resend errors', async () => {
    emailSender.sendRaw.mockRejectedValue(new Error('Resend down'));

    await expect(
      service.submit({
        email: 'maya@company.com',
        subject: 'Billing & plans',
        message: 'Question about my subscription plan.',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    await expect(
      service.submit({
        email: 'maya@company.com',
        subject: 'Billing & plans',
        message: 'Question about my subscription plan.',
      }),
    ).rejects.toMatchObject({
      response: { code: 'CONTACT_SEND_FAILED' },
    });
  });
});
