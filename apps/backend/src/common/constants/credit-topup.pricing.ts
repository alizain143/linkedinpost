export const CREDIT_TOPUP_MIN = 25;
export const CREDIT_TOPUP_MAX = 2000;
export const CREDIT_TOPUP_LIST_CENTS_PER_CREDIT = 20; // $0.20

export interface CreditTopupQuote {
  credits: number;
  unitPriceCents: number;
  totalCents: number;
  listTotalCents: number;
  discountPercent: number;
}

export class CreditTopupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreditTopupValidationError';
  }
}

export function getUnitPriceCentsForCredits(credits: number): number {
  if (credits >= 500) return 12;
  if (credits >= 250) return 14;
  if (credits >= 100) return 17;
  return CREDIT_TOPUP_LIST_CENTS_PER_CREDIT;
}

export function quoteCreditTopup(credits: number): CreditTopupQuote {
  if (!Number.isInteger(credits)) {
    throw new CreditTopupValidationError('credits must be an integer');
  }
  if (credits < CREDIT_TOPUP_MIN || credits > CREDIT_TOPUP_MAX) {
    throw new CreditTopupValidationError(
      `credits must be between ${CREDIT_TOPUP_MIN} and ${CREDIT_TOPUP_MAX}`,
    );
  }

  const unitPriceCents = getUnitPriceCentsForCredits(credits);
  const totalCents = credits * unitPriceCents;
  const listTotalCents = credits * CREDIT_TOPUP_LIST_CENTS_PER_CREDIT;
  const discountPercent =
    listTotalCents > 0
      ? Math.round(((listTotalCents - totalCents) / listTotalCents) * 100)
      : 0;

  return {
    credits,
    unitPriceCents,
    totalCents,
    listTotalCents,
    discountPercent,
  };
}
