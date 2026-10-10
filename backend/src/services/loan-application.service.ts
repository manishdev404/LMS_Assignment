import { ObjectId } from 'mongodb';
import { BRE_THRESHOLDS, INDIVIDUAL_PAN_REGEX } from '../constants/bre';
import { LOAN_LIMITS, LOAN_STATUS } from '../constants/loan';
import { SALARY_SLIP_UPLOAD } from '../constants/upload';
import { collections } from '../db/collections';
import type { AuthUser } from '../interfaces/auth.interface';
import type {
  ApplicationConfigDto,
  ApplicationStateDto,
  ApplicationStep,
  BorrowerProfileDocument,
} from '../interfaces/borrower.interface';
import type { ApplyLoanInput, LoanDocument, LoanDto } from '../interfaces/loan.interface';
import type { LoanWithPaymentsDto } from '../interfaces/payment.interface';
import { AppError } from '../utils/app-error';
import { calculateLoanQuote } from '../utils/loan-math';
import { toLoanDto, toProfileDto } from '../utils/mappers';
import { isDuplicateKeyError, toActorSnapshot } from '../utils/mongo';
import { evaluateEligibility } from './bre.service';
import { findProfileByUserId } from './borrower-profile.service';
import { findActiveLoan, generateLoanNumber, listPaymentsForLoan } from './loan.service';

const ACTIVE_LOAN_MESSAGE = 'You already have an active loan. You can apply again once it is closed.';

/** Limits the client needs to render sliders, the eligibility checklist and the uploader. */
export const APPLICATION_CONFIG: ApplicationConfigDto = {
  loan: {
    minPrincipal: LOAN_LIMITS.MIN_PRINCIPAL,
    maxPrincipal: LOAN_LIMITS.MAX_PRINCIPAL,
    principalStep: LOAN_LIMITS.PRINCIPAL_STEP,
    minTenureDays: LOAN_LIMITS.MIN_TENURE_DAYS,
    maxTenureDays: LOAN_LIMITS.MAX_TENURE_DAYS,
    interestRatePa: LOAN_LIMITS.INTEREST_RATE_PA,
  },
  eligibility: {
    minAge: BRE_THRESHOLDS.MIN_AGE,
    maxAge: BRE_THRESHOLDS.MAX_AGE,
    minMonthlySalary: BRE_THRESHOLDS.MIN_MONTHLY_SALARY,
    panPattern: INDIVIDUAL_PAN_REGEX.source,
  },
  upload: {
    maxSizeBytes: SALARY_SLIP_UPLOAD.MAX_SIZE_BYTES,
    allowedMimeTypes: SALARY_SLIP_UPLOAD.ALLOWED_TYPES.map((type) => type.mimeType),
  },
};

function resolveNextStep(profile: BorrowerProfileDocument | null, hasActiveLoan: boolean): ApplicationStep {
  if (hasActiveLoan) return 'TRACK_LOAN';
  if (!profile?.bre.eligible) return 'PERSONAL_DETAILS';
  if (!profile.salarySlip) return 'SALARY_SLIP';
  return 'LOAN_CONFIG';
}

/** Drives the borrower wizard: what has been done and which step comes next. */
export async function getApplicationState(userId: ObjectId): Promise<ApplicationStateDto> {
  const [profile, activeLoan] = await Promise.all([findProfileByUserId(userId), findActiveLoan(userId)]);
  return {
    profile: profile ? toProfileDto(profile) : null,
    activeLoan: activeLoan ? toLoanDto(activeLoan) : null,
    nextStep: resolveNextStep(profile, activeLoan !== null),
    config: APPLICATION_CONFIG,
  };
}

/** Step 4 — creates the loan in APPLIED (pending) status. */
export async function applyForLoan(user: AuthUser, input: ApplyLoanInput): Promise<LoanDto> {
  const profile = await findProfileByUserId(user.id);
  if (!profile?.bre.eligible) {
    throw AppError.conflict(
      'Complete your personal details and pass the eligibility check first.',
      'PROFILE_INCOMPLETE',
    );
  }
  if (!profile.salarySlip) {
    throw AppError.conflict('Upload your salary slip before applying.', 'PROFILE_INCOMPLETE');
  }

  // Never trust an old decision: age may have crossed a limit since the details were submitted.
  const decision = evaluateEligibility(profile);
  if (!decision.eligible) {
    await collections.borrowerProfiles().updateOne(
      { _id: profile._id },
      { $set: { bre: { ...decision, evaluatedAt: new Date() }, updatedAt: new Date() } },
    );
    throw AppError.unprocessable('You are no longer eligible for a loan.', 'BRE_REJECTED', {
      failures: decision.failures,
      age: decision.age,
    });
  }

  if (await findActiveLoan(user.id)) {
    throw AppError.conflict(ACTIVE_LOAN_MESSAGE, 'ACTIVE_LOAN_EXISTS');
  }

  // Money is always computed server-side; the client's live preview is display-only.
  const quote = calculateLoanQuote(input.principal, input.tenureDays);
  const actor = toActorSnapshot(user);
  const now = new Date();

  const loan: LoanDocument = {
    _id: new ObjectId(),
    loanNumber: await generateLoanNumber(),
    borrowerId: user.id,
    applicant: {
      fullName: profile.fullName,
      email: user.email,
      pan: profile.pan,
      dateOfBirth: profile.dateOfBirth,
      age: decision.age,
      monthlySalary: profile.monthlySalary,
      employmentMode: profile.employmentMode,
    },
    salarySlip: profile.salarySlip,
    ...quote,
    amountPaid: 0,
    status: LOAN_STATUS.APPLIED,
    rejectionReason: null,
    sanctionedAt: null,
    sanctionedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    disbursedAt: null,
    disbursedBy: null,
    closedAt: null,
    statusHistory: [{ status: LOAN_STATUS.APPLIED, at: now, by: actor, note: null }],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await collections.loans().insertOne(loan);
  } catch (error) {
    // The partial unique index catches a double-submitted "Apply".
    if (isDuplicateKeyError(error, 'borrowerId')) {
      throw AppError.conflict(ACTIVE_LOAN_MESSAGE, 'ACTIVE_LOAN_EXISTS');
    }
    throw error;
  }

  return toLoanDto(loan);
}

export async function listBorrowerLoans(borrowerId: ObjectId): Promise<LoanDto[]> {
  const loans = await collections.loans().find({ borrowerId }).sort({ createdAt: -1 }).toArray();
  return loans.map(toLoanDto);
}

/** Scoped by borrower: someone else's loan id is a 404, never a 403 (don't reveal it exists). */
export async function getBorrowerLoan(borrowerId: ObjectId, loanId: ObjectId): Promise<LoanWithPaymentsDto> {
  const loan = await collections.loans().findOne({ _id: loanId, borrowerId });
  if (!loan) {
    throw AppError.notFound('Loan not found.');
  }
  return { loan: toLoanDto(loan), payments: await listPaymentsForLoan(loanId) };
}
