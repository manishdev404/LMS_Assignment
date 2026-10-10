import type { ObjectId } from 'mongodb';
import type { ActorDto, ActorSnapshot } from './common.interface';
import type { LoanDto } from './loan.interface';

export interface PaymentDocument {
  _id: ObjectId;
  loanId: ObjectId;
  borrowerId: ObjectId;
  /** Unique transaction reference (upper-cased). Unique across all payments. */
  utr: string;
  amount: number;
  /** UTC midnight of the calendar date the borrower paid. */
  paymentDate: Date;
  recordedBy: ActorSnapshot;
  createdAt: Date;
}

export interface RecordPaymentInput {
  utr: string;
  amount: number;
  paymentDate: Date;
}

export interface PaymentDto {
  id: string;
  loanId: string;
  utr: string;
  amount: number;
  paymentDate: string;
  recordedBy: ActorDto;
  createdAt: string;
}

export interface RecordPaymentResult {
  payment: PaymentDto;
  loan: LoanDto;
  loanClosed: boolean;
}

export interface LoanWithPaymentsDto {
  loan: LoanDto;
  payments: PaymentDto[];
}
