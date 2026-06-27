import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  priceStarter: process.env.STRIPE_PRICE_STARTER,
  pricePro: process.env.STRIPE_PRICE_PRO,
  priceAgency: process.env.STRIPE_PRICE_AGENCY,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));
