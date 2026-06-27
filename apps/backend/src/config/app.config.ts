import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  approvalLinkExpiryDays: Number(process.env.APPROVAL_LINK_EXPIRY_DAYS ?? 14),
}));
