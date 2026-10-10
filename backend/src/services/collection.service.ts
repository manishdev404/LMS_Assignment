import { ObjectId } from 'mongodb';
import { LOAN_STATUS } from '../constants/loan';
import { collections } from '../db/collections';
import { runInTransaction } from '../db/transaction';
import type { AuthUser } from '../interfaces/auth.interface';
import type { Paginated } from '../interfaces/common.interface';
import type { CollectionListQuery } from '../interfaces/dashboard.interface';
import type { LoanDto } from '../interfaces/loan.interface';
import type {
  LoanWithPaymentsDto,
  PaymentDocument,
  RecordPaymentInput,
  RecordPaymentResult,
} from '../interfaces/payment.interface';
import { AppError } from '../utils/app-error';
import { calendarDateInTimezone, toIsoDate } from '../utils/date';
import { formatInr, fromPaise, toPaise } from '../utils/money';
import { toLoanDto, toPaymentDto } from '../utils/mappers';
import { isDuplicateKeyError, toActorSnapshot } from '../utils/mongo';
import { getLoanOrThrow, listLoans, listPaymentsForLoan, transitionLoan } from './loan.service';

const COLLECTION_STATUSES = [LOAN_STATUS.DISBURSED, LOAN_STATUS.CLOSED];

const duplicateUtr = (utr: string): AppError =>
  AppError.conflict(`UTR ${utr} has already been recorded against a payment.`, 'DUPLICATE_UTR');

export function listCollectionLoans(query: CollectionListQuery): Promise<Paginated<LoanDto>> {
  return query.view === 'closed'
    ? listLoans({ status: LOAN_STATUS.CLOSED }, query, { closedAt: -1 })
    : listLoans({ status: LOAN_STATUS.DISBURSED }, query, { disbursedAt: 1 });
}

export async function getLoanPayments(loanId: ObjectId): Promise<LoanWithPaymentsDto> {
  const loan = await getLoanOrThrow(loanId);
  if (!COLLECTION_STATUSES.includes(loan.status as (typeof COLLECTION_STATUSES)[number])) {
    throw AppError.notFound('This loan has not been disbursed yet.');
  }
  return { loan: toLoanDto(loan), payments: await listPaymentsForLoan(loanId) };
}

/**
 * Records a payment and, when the balance reaches zero, closes the loan — all in one transaction
 * so the payment and the loan's running total can never disagree.
 */
export async function recordPayment(
  user: AuthUser,
  loanId: ObjectId,
  input: RecordPaymentInput,
): Promise<RecordPaymentResult> {
  // Friendly early check; the unique index on `utr` is the real guarantee.
  if (await collections.payments().findOne({ utr: input.utr }, { projection: { _id: 1 } })) {
    throw duplicateUtr(input.utr);
  }

  const actor = toActorSnapshot(user);

  try {
    return await runInTransaction(async (session) => {
      const loan = await getLoanOrThrow(loanId, session);
      if (loan.status !== LOAN_STATUS.DISBURSED) {
        throw AppError.conflict(
          `Payments can only be recorded against active (DISBURSED) loans. Loan ${loan.loanNumber} is ${loan.status}.`,
          'INVALID_STATUS_TRANSITION',
        );
      }

      const totalPaise = toPaise(loan.totalRepayment);
      const paidPaise = toPaise(loan.amountPaid);
      const outstandingPaise = totalPaise - paidPaise;
      const amountPaise = toPaise(input.amount);

      if (amountPaise > outstandingPaise) {
        throw AppError.unprocessable(
          `Amount ${formatInr(input.amount)} exceeds the outstanding balance of ${formatInr(fromPaise(outstandingPaise))}.`,
          'AMOUNT_EXCEEDS_OUTSTANDING',
          { outstanding: fromPaise(outstandingPaise) },
        );
      }

      if (loan.disbursedAt && input.paymentDate < calendarDateInTimezone(loan.disbursedAt)) {
        throw AppError.unprocessable(
          `Payment date cannot be before the disbursement date (${toIsoDate(calendarDateInTimezone(loan.disbursedAt))}).`,
          'INVALID_PAYMENT_DATE',
        );
      }

      const now = new Date();
      const payment: PaymentDocument = {
        _id: new ObjectId(),
        loanId: loan._id,
        borrowerId: loan.borrowerId,
        utr: input.utr,
        amount: fromPaise(amountPaise),
        paymentDate: input.paymentDate,
        recordedBy: actor,
        createdAt: now,
      };
      await collections.payments().insertOne(payment, { session });

      const newPaidPaise = paidPaise + amountPaise;
      // Optimistic guard on the value we read, in addition to the transaction's isolation.
      const updated = await collections.loans().findOneAndUpdate(
        { _id: loan._id, status: LOAN_STATUS.DISBURSED, amountPaid: loan.amountPaid },
        { $set: { amountPaid: fromPaise(newPaidPaise), updatedAt: now } },
        { returnDocument: 'after', session },
      );
      if (!updated) {
        throw AppError.conflict('This loan was updated by someone else. Please refresh and try again.');
      }

      const fullyRepaid = newPaidPaise === totalPaise;
      const finalLoan = fullyRepaid
        ? await transitionLoan({
            loanId: loan._id,
            from: LOAN_STATUS.DISBURSED,
            to: LOAN_STATUS.CLOSED,
            actor,
            set: { closedAt: now },
            note: 'Auto-closed: total repayment received',
            session,
          })
        : updated;

      return { payment: toPaymentDto(payment), loan: toLoanDto(finalLoan), loanClosed: fullyRepaid };
    });
  } catch (error) {
    if (isDuplicateKeyError(error, 'utr')) {
      throw duplicateUtr(input.utr);
    }
    throw error;
  }
}
