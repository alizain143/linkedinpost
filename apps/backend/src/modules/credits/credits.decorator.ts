import { SetMetadata } from '@nestjs/common';

export const CREDITS_COST_KEY = 'credits:cost';

export const CreditsCost = (cost = 1) => SetMetadata(CREDITS_COST_KEY, cost);
