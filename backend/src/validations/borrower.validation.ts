import { z } from 'zod';
import { EMPLOYMENT_MODE_VALUES } from '../constants/bre';
import { LOAN_LIMITS } from '../constants/loan';
import { formatInr, hasAtMostTwoDecimals } from '../utils/money';
import { pastOrTodayDateSchema } from './common.validation';

/**
 * Only *malformed* input is rejected here (400). Eligibility — age, salary, PAN format and
 * employment — is decided by the Business Rule Engine so the user gets a BRE decision (422).
 */
export const personalDetailsSchema = z.object({
  fullName: z
    .string({ error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .regex(/^\p{L}[\p{L} .'-]*$/u, "Use letters, spaces, dots, apostrophes or hyphens only"),
  pan: z
    .string({ error: 'PAN is required' })
    .trim()
    .toUpperCase()
    .min(1, 'PAN is required')
    .max(20, 'PAN is too long'),
  dateOfBirth: pastOrTodayDateSchema.refine(
    (date) => date.getUTCFullYear() >= 1900,
    'Enter a realistic date of birth',
  ),
  monthlySalary: z
    .number({ error: 'Monthly salary must be a number' })
    .finite()
    .min(0, 'Monthly salary cannot be negative')
    .max(10_000_000, 'Monthly salary looks too large')
    .refine(hasAtMostTwoDecimals, 'Monthly salary can have at most 2 decimal places'),
  employmentMode: z.enum(EMPLOYMENT_MODE_VALUES, {
    error: 'Choose Salaried, Self-employed or Unemployed',
  }),
});

export const applyLoanSchema = z.object({
  principal: z
    .number({ error: 'Loan amount must be a number' })
    .int('Loan amount must be a whole number of rupees')
    .min(LOAN_LIMITS.MIN_PRINCIPAL, `Minimum loan amount is ${formatInr(LOAN_LIMITS.MIN_PRINCIPAL)}`)
    .max(LOAN_LIMITS.MAX_PRINCIPAL, `Maximum loan amount is ${formatInr(LOAN_LIMITS.MAX_PRINCIPAL)}`),
  tenureDays: z
    .number({ error: 'Tenure must be a number' })
    .int('Tenure must be a whole number of days')
    .min(LOAN_LIMITS.MIN_TENURE_DAYS, `Minimum tenure is ${LOAN_LIMITS.MIN_TENURE_DAYS} days`)
    .max(LOAN_LIMITS.MAX_TENURE_DAYS, `Maximum tenure is ${LOAN_LIMITS.MAX_TENURE_DAYS} days`),
});
