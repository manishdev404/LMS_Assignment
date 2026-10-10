import { ROLES, type Role } from './roles';

export const LOAN_STATUS = {
  APPLIED: 'APPLIED',
  SANCTIONED: 'SANCTIONED',
  REJECTED: 'REJECTED',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

export const LOAN_STATUS_VALUES = Object.values(LOAN_STATUS) as [LoanStatus, ...LoanStatus[]];

/** A borrower may hold at most one loan in any of these states. */
export const ACTIVE_LOAN_STATUSES: readonly LoanStatus[] = [
  LOAN_STATUS.APPLIED,
  LOAN_STATUS.SANCTIONED,
  LOAN_STATUS.DISBURSED,
];

/**
 * Loan state machine: `from → to → roles allowed to trigger it`.
 *
 *   APPLIED ──▶ SANCTIONED ──▶ DISBURSED ──▶ CLOSED
 *      └──────▶ REJECTED
 *
 * DISBURSED → CLOSED is triggered automatically when a recorded payment clears the balance.
 */
export const LOAN_TRANSITIONS: Record<LoanStatus, Partial<Record<LoanStatus, readonly Role[]>>> = {
  APPLIED: {
    SANCTIONED: [ROLES.ADMIN, ROLES.SANCTION],
    REJECTED: [ROLES.ADMIN, ROLES.SANCTION],
  },
  SANCTIONED: {
    DISBURSED: [ROLES.ADMIN, ROLES.DISBURSEMENT],
  },
  DISBURSED: {
    CLOSED: [ROLES.ADMIN, ROLES.COLLECTION],
  },
  REJECTED: {},
  CLOSED: {},
};

export const LOAN_LIMITS = {
  MIN_PRINCIPAL: 50_000,
  MAX_PRINCIPAL: 500_000,
  PRINCIPAL_STEP: 1_000,
  MIN_TENURE_DAYS: 30,
  MAX_TENURE_DAYS: 365,
  INTEREST_RATE_PA: 12,
  DAYS_IN_YEAR: 365,
} as const;

export const LOAN_NUMBER_PREFIX = 'LN';
export const LOAN_NUMBER_COUNTER_ID = 'loanNumber';
