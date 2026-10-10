import type { ObjectId } from 'mongodb';
import { LOAN_STATUS } from '../constants/loan';
import type { AuthUser } from '../interfaces/auth.interface';
import type { Paginated, PaginationQuery } from '../interfaces/common.interface';
import type { LoanDto } from '../interfaces/loan.interface';
import { toLoanDto } from '../utils/mappers';
import { toActorSnapshot } from '../utils/mongo';
import { listLoans, transitionLoan } from './loan.service';

/** Sanctioned loans waiting for funds to be released, oldest sanction first. */
export function listSanctionedLoans(query: PaginationQuery): Promise<Paginated<LoanDto>> {
  return listLoans({ status: LOAN_STATUS.SANCTIONED }, query, { sanctionedAt: 1 });
}

/** SANCTIONED → DISBURSED: the loan becomes active and enters the collection queue. */
export async function disburseLoan(user: AuthUser, loanId: ObjectId, note?: string): Promise<LoanDto> {
  const actor = toActorSnapshot(user);
  const loan = await transitionLoan({
    loanId,
    from: LOAN_STATUS.SANCTIONED,
    to: LOAN_STATUS.DISBURSED,
    actor,
    set: { disbursedAt: new Date(), disbursedBy: actor },
    note: note ?? null,
  });
  return toLoanDto(loan);
}
