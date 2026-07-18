import { registerAs } from '@nestjs/config';
import { primaryFrontendUrl } from './frontend-url';

export default registerAs('xpay', () => ({
  publicKey: process.env.XPAY_PUBLIC_KEY,
  privateKey: process.env.XPAY_PRIVATE_KEY,
  webhookSecret: process.env.XPAY_WEBHOOK_SECRET,
  currency: process.env.XPAY_CURRENCY ?? 'USD',
  amountStarter: process.env.XPAY_AMOUNT_STARTER
    ? Number(process.env.XPAY_AMOUNT_STARTER)
    : undefined,
  amountPro: process.env.XPAY_AMOUNT_PRO
    ? Number(process.env.XPAY_AMOUNT_PRO)
    : undefined,
  amountAgency: process.env.XPAY_AMOUNT_AGENCY
    ? Number(process.env.XPAY_AMOUNT_AGENCY)
    : undefined,
  cycleCount: process.env.XPAY_SUBSCRIPTION_CYCLE_COUNT
    ? Number(process.env.XPAY_SUBSCRIPTION_CYCLE_COUNT)
    : 120,
  apiBaseUrl:
    process.env.XPAY_API_BASE_URL ?? 'https://api.xpaycheckout.com',
  frontendUrl: primaryFrontendUrl(),
}));
