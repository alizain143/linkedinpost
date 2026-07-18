import { registerAs } from '@nestjs/config';
import { primaryFrontendUrl } from './frontend-url';

export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail:
    process.env.RESEND_FROM_EMAIL ?? 'notifications@linkedinpost.ai',
  contactToEmail:
    process.env.CONTACT_TO_EMAIL ?? 'hello@linkedinpost.ai',
  frontendUrl: primaryFrontendUrl(),
}));
