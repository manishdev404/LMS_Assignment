import type {
  BorrowerProfileDocument,
  BorrowerProfileDto,
  SalarySlipDto,
  SalarySlipMeta,
} from '../interfaces/borrower.interface';
import type { ActorDto, ActorSnapshot } from '../interfaces/common.interface';
import type { LoanDocument, LoanDto } from '../interfaces/loan.interface';
import type { PaymentDocument, PaymentDto } from '../interfaces/payment.interface';
import type { UserDocument, UserDto } from '../interfaces/user.interface';
import { toIsoDate } from './date';
import { calculateOutstanding } from './loan-math';

const isoOrNull = (date: Date | null): string | null => (date ? date.toISOString() : null);

export function toUserDto(user: UserDocument): UserDto {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toActorDto(actor: ActorSnapshot): ActorDto {
  return { id: actor.userId.toHexString(), name: actor.name, role: actor.role };
}

const actorOrNull = (actor: ActorSnapshot | null): ActorDto | null => (actor ? toActorDto(actor) : null);

export function toSalarySlipDto(slip: SalarySlipMeta): SalarySlipDto {
  return {
    originalName: slip.originalName,
    mimeType: slip.mimeType,
    size: slip.size,
    uploadedAt: slip.uploadedAt.toISOString(),
  };
}

export function toProfileDto(profile: BorrowerProfileDocument): BorrowerProfileDto {
  return {
    fullName: profile.fullName,
    pan: profile.pan,
    dateOfBirth: toIsoDate(profile.dateOfBirth),
    monthlySalary: profile.monthlySalary,
    employmentMode: profile.employmentMode,
    bre: {
      eligible: profile.bre.eligible,
      age: profile.bre.age,
      failures: profile.bre.failures,
      evaluatedAt: profile.bre.evaluatedAt.toISOString(),
    },
    salarySlip: profile.salarySlip ? toSalarySlipDto(profile.salarySlip) : null,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function toLoanDto(loan: LoanDocument): LoanDto {
  return {
    id: loan._id.toHexString(),
    loanNumber: loan.loanNumber,
    borrowerId: loan.borrowerId.toHexString(),
    applicant: { ...loan.applicant, dateOfBirth: toIsoDate(loan.applicant.dateOfBirth) },
    salarySlip: toSalarySlipDto(loan.salarySlip),
    principal: loan.principal,
    tenureDays: loan.tenureDays,
    interestRatePa: loan.interestRatePa,
    simpleInterest: loan.simpleInterest,
    totalRepayment: loan.totalRepayment,
    amountPaid: loan.amountPaid,
    outstanding: calculateOutstanding(loan.totalRepayment, loan.amountPaid),
    status: loan.status,
    rejectionReason: loan.rejectionReason,
    sanctionedAt: isoOrNull(loan.sanctionedAt),
    sanctionedBy: actorOrNull(loan.sanctionedBy),
    rejectedAt: isoOrNull(loan.rejectedAt),
    rejectedBy: actorOrNull(loan.rejectedBy),
    disbursedAt: isoOrNull(loan.disbursedAt),
    disbursedBy: actorOrNull(loan.disbursedBy),
    closedAt: isoOrNull(loan.closedAt),
    statusHistory: loan.statusHistory.map((entry) => ({
      status: entry.status,
      at: entry.at.toISOString(),
      by: toActorDto(entry.by),
      note: entry.note,
    })),
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
  };
}

export function toPaymentDto(payment: PaymentDocument): PaymentDto {
  return {
    id: payment._id.toHexString(),
    loanId: payment.loanId.toHexString(),
    utr: payment.utr,
    amount: payment.amount,
    paymentDate: toIsoDate(payment.paymentDate),
    recordedBy: toActorDto(payment.recordedBy),
    createdAt: payment.createdAt.toISOString(),
  };
}
