import {
  CREDIT_TOPUP_LIST_CENTS_PER_CREDIT,
  CREDIT_TOPUP_MAX,
  CREDIT_TOPUP_MIN,
  CreditTopupValidationError,
  getUnitPriceCentsForCredits,
  quoteCreditTopup,
} from './credit-topup.pricing';

describe('credit-topup.pricing', () => {
  it('rejects out of range amounts', () => {
    expect(() => quoteCreditTopup(24)).toThrow(CreditTopupValidationError);
    expect(() => quoteCreditTopup(2001)).toThrow(CreditTopupValidationError);
    expect(() => quoteCreditTopup(50.5)).toThrow(CreditTopupValidationError);
  });

  it('applies tier unit prices', () => {
    expect(getUnitPriceCentsForCredits(25)).toBe(CREDIT_TOPUP_LIST_CENTS_PER_CREDIT);
    expect(getUnitPriceCentsForCredits(100)).toBe(17);
    expect(getUnitPriceCentsForCredits(250)).toBe(14);
    expect(getUnitPriceCentsForCredits(500)).toBe(12);
  });

  it('quotes totals and discount', () => {
    expect(quoteCreditTopup(50)).toEqual({
      credits: 50,
      unitPriceCents: 20,
      totalCents: 1000,
      listTotalCents: 1000,
      discountPercent: 0,
    });
    expect(quoteCreditTopup(150)).toEqual({
      credits: 150,
      unitPriceCents: 17,
      totalCents: 2550,
      listTotalCents: 3000,
      discountPercent: 15,
    });
    expect(CREDIT_TOPUP_MIN).toBe(25);
    expect(CREDIT_TOPUP_MAX).toBe(2000);
  });
});
