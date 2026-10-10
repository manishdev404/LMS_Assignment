/**
 * Client copy of backend/src/utils/loan-math.ts — used only for the live preview.
 * The server recomputes everything when the loan is created.
 *
 *   SI    = (P × R × T) / (365 × 100)     T = tenure in days
 *   Total = P + SI
 */
export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRatePa: number;
  simpleInterest: number;
  totalRepayment: number;
}

const DAYS_IN_YEAR = 365;

export function calculateLoanQuote(principal: number, tenureDays: number, interestRatePa: number): LoanQuote {
  const principalPaise = Math.round(principal * 100);
  const interestPaise = Math.round((principalPaise * interestRatePa * tenureDays) / (DAYS_IN_YEAR * 100));
  return {
    principal: principalPaise / 100,
    tenureDays,
    interestRatePa,
    simpleInterest: interestPaise / 100,
    totalRepayment: (principalPaise + interestPaise) / 100,
  };
}
