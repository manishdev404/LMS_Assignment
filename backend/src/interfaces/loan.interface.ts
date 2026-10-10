import type { ObjectId } from 'mongodb';
import type { EmploymentMode } from '../constants/bre';
import type { LoanStatus } from '../constants/loan';
import type { SalarySlipDto, SalarySlipMeta } from './borrower.interface';
import type { ActorDto, ActorSnapshot } from './common.interface';

/** Borrower details frozen at the moment of application. */
export interface ApplicantSnapshot {
  fullName: string;
  email: string;
  pan: string;
  dateOfBirth: Date;
  age: number;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface StatusHistoryEntry {
  status: LoanStatus;
  at: Date;
  by: ActorSnapshot;
  note: string | null;
}

export interface LoanQuote {
  principal: number;
  tenureDays: number;
  interestRatePa: number;
  simpleInterest: number;
  totalRepayment: number;
}

export interface LoanDocument extends LoanQuote {
  _id: ObjectId;
  loanNumber: string;
  borrowerId: ObjectId;
  applicant: ApplicantSnapshot;
  salarySlip: SalarySlipMeta;
  /** Running total of recorded payments. Outstanding = totalRepayment − amountPaid. */
  amountPaid: number;
  status: LoanStatus;
  rejectionReason: string | null;
  sanctionedAt: Date | null;
  sanctionedBy: ActorSnapshot | null;
  rejectedAt: Date | null;
  rejectedBy: ActorSnapshot | null;
  disbursedAt: Date | null;
  disbursedBy: ActorSnapshot | null;
  closedAt: Date | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplyLoanInput {
  principal: number;
  tenureDays: number;
}

export interface LoanDto extends LoanQuote {
  id: string;
  loanNumber: string;
  borrowerId: string;
  applicant: Omit<ApplicantSnapshot, 'dateOfBirth'> & { dateOfBirth: string };
  salarySlip: SalarySlipDto;
  amountPaid: number;
  outstanding: number;
  status: LoanStatus;
  rejectionReason: string | null;
  sanctionedAt: string | null;
  sanctionedBy: ActorDto | null;
  rejectedAt: string | null;
  rejectedBy: ActorDto | null;
  disbursedAt: string | null;
  disbursedBy: ActorDto | null;
  closedAt: string | null;
  statusHistory: Array<{ status: LoanStatus; at: string; by: ActorDto; note: string | null }>;
  createdAt: string;
  updatedAt: string;
}
