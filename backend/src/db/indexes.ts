import { ACTIVE_LOAN_STATUSES } from '../constants/loan';
import { collections } from './collections';

/** Idempotently creates every index the application relies on. */
export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    collections.users().createIndexes([
      { key: { email: 1 }, name: 'uniq_email', unique: true },
      { key: { role: 1, createdAt: -1 }, name: 'role_createdAt' },
    ]),
    collections.borrowerProfiles().createIndexes([
      { key: { userId: 1 }, name: 'uniq_userId', unique: true },
      {
        key: { pan: 1 },
        name: 'uniq_pan_for_eligible_profiles',
        unique: true,
        partialFilterExpression: { 'bre.eligible': true },
      },
    ]),
    collections.loans().createIndexes([
      { key: { loanNumber: 1 }, name: 'uniq_loanNumber', unique: true },
      {
        // Database-level guarantee that a borrower never holds two active loans,
        // even if two "Apply" requests race each other.
        key: { borrowerId: 1 },
        name: 'uniq_active_loan_per_borrower',
        unique: true,
        partialFilterExpression: { status: { $in: [...ACTIVE_LOAN_STATUSES] } },
      },
      { key: { borrowerId: 1, createdAt: -1 }, name: 'borrower_createdAt' },
      { key: { status: 1, createdAt: 1 }, name: 'status_createdAt' },
    ]),
    collections.payments().createIndexes([
      { key: { utr: 1 }, name: 'uniq_utr', unique: true },
      { key: { loanId: 1, paymentDate: -1 }, name: 'loan_paymentDate' },
    ]),
  ]);
}
