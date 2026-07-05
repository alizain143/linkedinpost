const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  AED: 3.67,
  ARS: 1050,
  AUD: 1.55,
  BDT: 110,
  BGN: 1.8,
  BHD: 0.376,
  BRL: 5.8,
  CAD: 1.38,
  CHF: 0.88,
  CLP: 950,
  CNY: 7.25,
  COP: 4100,
  CZK: 23.5,
  DKK: 6.85,
  EGP: 50,
  EUR: 0.92,
  GBP: 0.79,
  GHS: 15,
  HKD: 7.8,
  HUF: 365,
  IDR: 15800,
  ILS: 3.65,
  INR: 83,
  JPY: 150,
  KES: 130,
  KRW: 1350,
  KWD: 0.31,
  MXN: 17,
  MYR: 4.7,
  NGN: 1550,
  NOK: 10.6,
  NZD: 1.68,
  PHP: 56,
  PKR: 280,
  PLN: 3.95,
  QAR: 3.64,
  RON: 4.6,
  SAR: 3.75,
  SEK: 10.5,
  SGD: 1.34,
  THB: 35,
  TRY: 32,
  TWD: 32,
  VND: 25000,
  ZAR: 18.5,
};

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD", {
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      throw new Error(`Exchange rate fetch failed: ${response.status}`);
    }

    const data = (await response.json()) as { rates?: Record<string, number> };
    return { USD: 1, ...FALLBACK_RATES, ...data.rates };
  } catch {
    return FALLBACK_RATES;
  }
}
