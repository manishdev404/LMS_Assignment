import type { Collection } from 'mongodb';
import type { BorrowerProfileDocument } from '../interfaces/borrower.interface';
import type { CounterDocument } from '../interfaces/counter.interface';
import type { LoanDocument } from '../interfaces/loan.interface';
import type { PaymentDocument } from '../interfaces/payment.interface';
import type { UserDocument } from '../interfaces/user.interface';
import { getDb } from './client';

export const COLLECTIONS = {
  USERS: 'users',
  BORROWER_PROFILES: 'borrower_profiles',
  LOANS: 'loans',
  PAYMENTS: 'payments',
  COUNTERS: 'counters',
} as const;

/** Typed collection accessors — the only way services touch MongoDB collections. */
export const collections = {
  users: (): Collection<UserDocument> => getDb().collection<UserDocument>(COLLECTIONS.USERS),
  borrowerProfiles: (): Collection<BorrowerProfileDocument> =>
    getDb().collection<BorrowerProfileDocument>(COLLECTIONS.BORROWER_PROFILES),
  loans: (): Collection<LoanDocument> => getDb().collection<LoanDocument>(COLLECTIONS.LOANS),
  payments: (): Collection<PaymentDocument> =>
    getDb().collection<PaymentDocument>(COLLECTIONS.PAYMENTS),
  counters: (): Collection<CounterDocument> =>
    getDb().collection<CounterDocument>(COLLECTIONS.COUNTERS),
};
