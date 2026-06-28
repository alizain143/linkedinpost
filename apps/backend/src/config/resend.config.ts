import { registerAs } from '@nestjs/config';

export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail:
    process.env.RESEND_FROM_EMAIL ?? 'notifications@linkedinpost.ai',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));
