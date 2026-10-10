import { describe, expect, it } from 'vitest';
import { calculateAge, parseIsoDate } from '../src/utils/date';
import { calculateLoanQuote, calculateOutstanding } from '../src/utils/loan-math';
import { hasAtMostTwoDecimals, toPaise } from '../src/utils/money';

describe('calculateLoanQuote — SI = (P × R × T) / (365 × 100)', () => {
  it.each([
    // principal, tenure, expected SI, expected total
    [100_000, 365, 12_000, 112_000],
    [50_000, 30, 493.15, 50_493.15], // 493.1506… rounds down
    [500_000, 365, 60_000, 560_000], // maximums
    [50_000, 30, 493.15, 50_493.15], // minimums
    [123_000, 45, 1_819.73, 124_819.73], // 1819.7260… rounds up
    [75_000, 90, 2_219.18, 77_219.18],
  ])('P=%i, T=%i days → SI=%d, total=%d', (principal, tenureDays, simpleInterest, totalRepayment) => {
    expect(calculateLoanQuote(principal, tenureDays)).toEqual({
      principal,
      tenureDays,
      interestRatePa: 12,
      simpleInterest,
      totalRepayment,
    });
  });

  it('always yields amounts with at most 2 decimals', () => {
    for (let tenure = 30; tenure <= 365; tenure += 7) {
      const quote = calculateLoanQuote(87_000, tenure);
      expect(hasAtMostTwoDecimals(quote.simpleInterest)).toBe(true);
      expect(toPaise(quote.totalRepayment)).toBe(toPaise(quote.principal) + toPaise(quote.simpleInterest));
    }
  });
});

describe('calculateOutstanding', () => {
  it('is exact in paise (no floating-point drift)', () => {
    expect(calculateOutstanding(0.3, 0.1 + 0.2)).toBe(0);
    expect(calculateOutstanding(50_493.15, 25_000)).toBe(25_493.15);
  });

  it('never goes negative', () => {
    expect(calculateOutstanding(100, 150)).toBe(0);
  });
});

describe('date helpers', () => {
  it('rejects impossible calendar dates', () => {
    expect(parseIsoDate('2023-02-29')).toBeNull();
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('2024-13-01')).toBeNull();
  });

  it('counts completed years only', () => {
    const dob = parseIsoDate('2000-06-15') as Date;
    expect(calculateAge(dob, parseIsoDate('2026-06-14') as Date)).toBe(25);
    expect(calculateAge(dob, parseIsoDate('2026-06-15') as Date)).toBe(26);
  });
});
