import { LOAN_LIMITS } from '../constants/loan';
import type { LoanQuote } from '../interfaces/loan.interface';
import { fromPaise, toPaise } from './money';

/**
 * Simple interest for a tenure expressed in days:
 *
 *   SI    = (P × R × T) / (365 × 100)
 *   Total = P + SI
 *
 * Computed in integer paise and rounded half-up to the nearest paisa once.
 */
export function calculateLoanQuote(
  principal: number,
  tenureDays: number,
  interestRatePa: number = LOAN_LIMITS.INTEREST_RATE_PA,
): LoanQuote {
  const principalPaise = toPaise(principal);
  const interestPaise = Math.round(
    (principalPaise * interestRatePa * tenureDays) / (LOAN_LIMITS.DAYS_IN_YEAR * 100),
  );

  return {
    principal: fromPaise(principalPaise),
    tenureDays,
    interestRatePa,
    simpleInterest: fromPaise(interestPaise),
    totalRepayment: fromPaise(principalPaise + interestPaise),
  };
}

/** Outstanding balance in rupees, computed in paise. Never negative. */
export function calculateOutstanding(totalRepayment: number, amountPaid: number): number {
  return fromPaise(Math.max(0, toPaise(totalRepayment) - toPaise(amountPaid)));
}
