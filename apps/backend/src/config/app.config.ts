import { registerAs } from '@nestjs/config';
import { primaryFrontendUrl } from './frontend-url';

export default registerAs('app', () => ({
  frontendUrl: primaryFrontendUrl(),
  approvalLinkExpiryDays: Number(process.env.APPROVAL_LINK_EXPIRY_DAYS ?? 14),
}));
