import { registerAs } from '@nestjs/config';
import { primaryFrontendUrl } from './frontend-url';

export default registerAs('lemonsqueezy', () => ({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
  storeId: process.env.LEMONSQUEEZY_STORE_ID,
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  variantStarter: process.env.LEMONSQUEEZY_VARIANT_STARTER,
  variantPro: process.env.LEMONSQUEEZY_VARIANT_PRO,
  variantAgency: process.env.LEMONSQUEEZY_VARIANT_AGENCY,
  variantCredits: process.env.LEMONSQUEEZY_VARIANT_CREDITS,
  apiBaseUrl:
    process.env.LEMONSQUEEZY_API_BASE_URL ?? 'https://api.lemonsqueezy.com',
  frontendUrl: primaryFrontendUrl(),
}));
