import type { ObjectId } from 'mongodb';
import { LOAN_STATUS, LOAN_STATUS_VALUES, type LoanStatus } from '../constants/loan';
import { ROLES, type Role } from '../constants/roles';
import { collections } from '../db/collections';
import type { Paginated } from '../interfaces/common.interface';
import type { AdminOverviewDto, LoanListQuery } from '../interfaces/dashboard.interface';
import type { LoanDto } from '../interfaces/loan.interface';
import type { LoanWithPaymentsDto } from '../interfaces/payment.interface';
import { fromPaise, toPaise } from '../utils/money';
import { toLoanDto } from '../utils/mappers';
import { getLoanOrThrow, listLoans, listPaymentsForLoan } from './loan.service';
import { countLeads } from './sales.service';

const roundMoney = (value: number | undefined): number => fromPaise(toPaise(value ?? 0));

export async function getOverview(): Promise<AdminOverviewDto> {
  const loans = collections.loans();

  const [statusRows, leads, disbursedRows, collectedRows, outstandingRows, staffRows] = await Promise.all([
    loans.aggregate<{ _id: LoanStatus; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    countLeads(),
    loans
      .aggregate<{ total: number }>([
        { $match: { status: { $in: [LOAN_STATUS.DISBURSED, LOAN_STATUS.CLOSED] } } },
        { $group: { _id: null, total: { $sum: '$principal' } } },
      ])
      .toArray(),
    collections
      .payments()
      .aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$amount' } } }])
      .toArray(),
    loans
      .aggregate<{ total: number }>([
        { $match: { status: LOAN_STATUS.DISBURSED } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalRepayment', '$amountPaid'] } } } },
      ])
      .toArray(),
    collections
      .users()
      .aggregate<{ _id: Role; count: number }>([
        { $match: { role: { $ne: ROLES.BORROWER } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const loansByStatus = Object.fromEntries(LOAN_STATUS_VALUES.map((status) => [status, 0])) as Record<
    LoanStatus,
    number
  >;
  for (const row of statusRows) loansByStatus[row._id] = row.count;

  return {
    loansByStatus,
    leads,
    totalDisbursed: roundMoney(disbursedRows[0]?.total),
    totalCollected: roundMoney(collectedRows[0]?.total),
    outstanding: roundMoney(outstandingRows[0]?.total),
    staffByRole: Object.fromEntries(staffRows.map((row) => [row._id, row.count])),
  };
}

export function listAllLoans(query: LoanListQuery): Promise<Paginated<LoanDto>> {
  return listLoans(query.status ? { status: query.status } : {}, query, { createdAt: -1 });
}

export async function getLoanDetail(loanId: ObjectId): Promise<LoanWithPaymentsDto> {
  const loan = await getLoanOrThrow(loanId);
  return { loan: toLoanDto(loan), payments: await listPaymentsForLoan(loanId) };
}
