import type { GridFSBucketReadStream, ObjectId } from 'mongodb';
import { LOAN_STATUS } from '../constants/loan';
import type { AuthUser } from '../interfaces/auth.interface';
import type { SalarySlipMeta } from '../interfaces/borrower.interface';
import type { Paginated, PaginationQuery } from '../interfaces/common.interface';
import type { LoanDto } from '../interfaces/loan.interface';
import { toLoanDto } from '../utils/mappers';
import { toActorSnapshot } from '../utils/mongo';
import { openStoredFile } from './file-storage.service';
import { getLoanOrThrow, listLoans, transitionLoan } from './loan.service';

/** Applications waiting for a decision, oldest first (first come, first served). */
export function listPendingApplications(query: PaginationQuery): Promise<Paginated<LoanDto>> {
  return listLoans({ status: LOAN_STATUS.APPLIED }, query, { createdAt: 1 });
}

export async function approveLoan(user: AuthUser, loanId: ObjectId, note?: string): Promise<LoanDto> {
  const actor = toActorSnapshot(user);
  const loan = await transitionLoan({
    loanId,
    from: LOAN_STATUS.APPLIED,
    to: LOAN_STATUS.SANCTIONED,
    actor,
    set: { sanctionedAt: new Date(), sanctionedBy: actor },
    note: note ?? null,
  });
  return toLoanDto(loan);
}

export async function rejectLoan(user: AuthUser, loanId: ObjectId, reason: string): Promise<LoanDto> {
  const actor = toActorSnapshot(user);
  const loan = await transitionLoan({
    loanId,
    from: LOAN_STATUS.APPLIED,
    to: LOAN_STATUS.REJECTED,
    actor,
    set: { rejectedAt: new Date(), rejectedBy: actor, rejectionReason: reason },
    note: reason,
  });
  return toLoanDto(loan);
}

export async function openLoanSalarySlip(
  loanId: ObjectId,
): Promise<{ meta: SalarySlipMeta; stream: GridFSBucketReadStream }> {
  const loan = await getLoanOrThrow(loanId);
  return { meta: loan.salarySlip, stream: await openStoredFile(loan.salarySlip.fileId) };
}
