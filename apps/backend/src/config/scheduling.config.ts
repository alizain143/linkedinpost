import { registerAs } from '@nestjs/config';

export default registerAs('scheduling', () => ({
  minLeadMinutes: parseInt(process.env.SCHEDULE_MIN_LEAD_MINUTES ?? '15', 10),
  maxDays: parseInt(process.env.SCHEDULE_MAX_DAYS ?? '90', 10),
}));
