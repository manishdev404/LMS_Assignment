import type { ClientSession, Filter, ObjectId, Sort } from 'mongodb';
import {
  ACTIVE_LOAN_STATUSES,
  LOAN_NUMBER_COUNTER_ID,
  LOAN_NUMBER_PREFIX,
  LOAN_TRANSITIONS,
  type LoanStatus,
} from '../constants/loan';
import { collections } from '../db/collections';
import type { ActorSnapshot, Paginated, PaginationQuery } from '../interfaces/common.interface';
import type { LoanDocument, LoanDto } from '../interfaces/loan.interface';
import type { PaymentDto } from '../interfaces/payment.interface';
import { buildPagination } from '../utils/api-response';
import { AppError } from '../utils/app-error';
import { toLoanDto, toPaymentDto } from '../utils/mappers';
import { escapeRegex } from '../utils/mongo';

// ── Lookups ──────────────────────────────────────────────────────────────────

export async function getLoanOrThrow(loanId: ObjectId, session?: ClientSession): Promise<LoanDocument> {
  const loan = await collections.loans().findOne({ _id: loanId }, { session });
  if (!loan) {
    throw AppError.notFound('Loan not found.');
  }
  return loan;
}

export function findActiveLoan(borrowerId: ObjectId): Promise<LoanDocument | null> {
  return collections.loans().findOne({ borrowerId, status: { $in: [...ACTIVE_LOAN_STATUSES] } });
}

export async function assertNoActiveLoan(borrowerId: ObjectId, message: string): Promise<void> {
  const activeLoan = await findActiveLoan(borrowerId);
  if (activeLoan) {
    throw AppError.conflict(message, 'ACTIVE_LOAN_EXISTS', { loanNumber: activeLoan.loanNumber });
  }
}

export async function listPaymentsForLoan(loanId: ObjectId): Promise<PaymentDto[]> {
  const payments = await collections
    .payments()
    .find({ loanId })
    .sort({ paymentDate: -1, createdAt: -1 })
    .toArray();
  return payments.map(toPaymentDto);
}

/** Human-friendly sequential loan numbers: LN000001, LN000002, … */
export async function generateLoanNumber(): Promise<string> {
  const counter = await collections.counters().findOneAndUpdate(
    { _id: LOAN_NUMBER_COUNTER_ID },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const sequence = counter?.seq ?? 1;
  return `${LOAN_NUMBER_PREFIX}${String(sequence).padStart(6, '0')}`;
}

// ── Listing ──────────────────────────────────────────────────────────────────

function searchFilter(search: string | undefined): Filter<LoanDocument> {
  if (!search) return {};
  const pattern = new RegExp(escapeRegex(search), 'i');
  return {
    $or: [
      { loanNumber: pattern },
      { 'applicant.fullName': pattern },
      { 'applicant.email': pattern },
      { 'applicant.pan': pattern },
    ],
  };
}

export async function listLoans(
  baseFilter: Filter<LoanDocument>,
  query: PaginationQuery,
  sort: Sort,
): Promise<Paginated<LoanDto>> {
  const filter: Filter<LoanDocument> = { ...baseFilter, ...searchFilter(query.search) };
  const [loans, total] = await Promise.all([
    collections
      .loans()
      .find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .toArray(),
    collections.loans().countDocuments(filter),
  ]);

  return {
    items: loans.map(toLoanDto),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

// ── State machine ────────────────────────────────────────────────────────────

interface TransitionParams {
  loanId: ObjectId;
  from: LoanStatus;
  to: LoanStatus;
  actor: ActorSnapshot;
  /** Extra fields written together with the status change (audit timestamps, reason, …). */
  set?: Partial<LoanDocument>;
  note?: string | null;
  session?: ClientSession;
}

/**
 * The single place where a loan changes status.
 *  1. The transition must exist in LOAN_TRANSITIONS and the actor's role must be allowed.
 *  2. The update filters on the expected current status, so it is atomic: if two executives act
 *     on the same loan at once, exactly one succeeds and the other gets a 409.
 */
export async function transitionLoan({
  loanId,
  from,
  to,
  actor,
  set = {},
  note = null,
  session,
}: TransitionParams): Promise<LoanDocument> {
  const allowedRoles = LOAN_TRANSITIONS[from][to];
  if (!allowedRoles) {
    throw AppError.conflict(`A loan cannot move from ${from} to ${to}.`, 'INVALID_STATUS_TRANSITION');
  }
  if (!allowedRoles.includes(actor.role)) {
    throw AppError.forbidden(`Your role cannot move a loan from ${from} to ${to}.`);
  }

  const now = new Date();
  const updated = await collections.loans().findOneAndUpdate(
    { _id: loanId, status: from },
    {
      $set: { ...set, status: to, updatedAt: now },
      $push: { statusHistory: { status: to, at: now, by: actor, note } },
    },
    { returnDocument: 'after', session },
  );
  if (updated) return updated;

  const current = await getLoanOrThrow(loanId, session);
  throw AppError.conflict(
    `Loan ${current.loanNumber} is ${current.status}; only ${from} loans can be moved to ${to}.`,
    'INVALID_STATUS_TRANSITION',
    { currentStatus: current.status },
  );
}
