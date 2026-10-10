import type { GridFSBucketReadStream, ObjectId } from 'mongodb';
import { collections } from '../db/collections';
import type { AuthUser } from '../interfaces/auth.interface';
import type {
  BorrowerProfileDocument,
  BorrowerProfileDto,
  PersonalDetailsInput,
  SalarySlipDto,
  SalarySlipMeta,
  SalarySlipUpload,
} from '../interfaces/borrower.interface';
import { AppError } from '../utils/app-error';
import { toProfileDto, toSalarySlipDto } from '../utils/mappers';
import { isDuplicateKeyError } from '../utils/mongo';
import { evaluateEligibility } from './bre.service';
import { deleteStoredFile, openStoredFile, storeSalarySlip } from './file-storage.service';
import { assertNoActiveLoan } from './loan.service';

const FROZEN_WHILE_ACTIVE = 'You already have an active loan application, so your details cannot be changed right now.';

export function findProfileByUserId(userId: ObjectId): Promise<BorrowerProfileDocument | null> {
  return collections.borrowerProfiles().findOne({ userId });
}

/**
 * Step 2 — saves personal details and runs the BRE on the server.
 * The details and the BRE decision are persisted either way (Sales tracks rejected leads),
 * but a failed BRE is reported as 422 so the application is blocked.
 */
export async function savePersonalDetails(
  user: AuthUser,
  input: PersonalDetailsInput,
): Promise<BorrowerProfileDto> {
  await assertNoActiveLoan(user.id, FROZEN_WHILE_ACTIVE);

  const decision = evaluateEligibility(input);
  const now = new Date();

  if (decision.eligible) {
    const panOwner = await collections.borrowerProfiles().findOne(
      { pan: input.pan, 'bre.eligible': true, userId: { $ne: user.id } },
      { projection: { _id: 1 } },
    );
    if (panOwner) {
      throw AppError.conflict('This PAN is already linked to another account.', 'PAN_IN_USE');
    }
  }

  let profile: BorrowerProfileDocument | null;
  try {
    profile = await collections.borrowerProfiles().findOneAndUpdate(
      { userId: user.id },
      {
        $set: {
          fullName: input.fullName,
          pan: input.pan,
          dateOfBirth: input.dateOfBirth,
          monthlySalary: input.monthlySalary,
          employmentMode: input.employmentMode,
          bre: { ...decision, evaluatedAt: now },
          updatedAt: now,
        },
        $setOnInsert: { userId: user.id, salarySlip: null, createdAt: now },
      },
      { upsert: true, returnDocument: 'after' },
    );
  } catch (error) {
    if (isDuplicateKeyError(error, 'pan')) {
      throw AppError.conflict('This PAN is already linked to another account.', 'PAN_IN_USE');
    }
    throw error;
  }

  if (!profile) {
    throw new Error('Profile upsert returned no document');
  }

  if (!decision.eligible) {
    throw AppError.unprocessable(
      'You are not eligible for a loan based on the details provided.',
      'BRE_REJECTED',
      { failures: decision.failures, age: decision.age },
    );
  }

  return toProfileDto(profile);
}

/** Step 3 — stores the slip in GridFS and links it to the borrower's profile. */
export async function uploadSalarySlip(user: AuthUser, upload: SalarySlipUpload | null): Promise<SalarySlipDto> {
  if (!upload) {
    throw AppError.badRequest('Please attach your salary slip (PDF, JPG or PNG).', undefined, 'FILE_REQUIRED');
  }

  const profile = await findProfileByUserId(user.id);
  if (!profile?.bre.eligible) {
    throw AppError.conflict(
      'Complete your personal details and pass the eligibility check before uploading a salary slip.',
      'PROFILE_INCOMPLETE',
    );
  }
  await assertNoActiveLoan(user.id, FROZEN_WHILE_ACTIVE);

  const slip = await storeSalarySlip(upload, user.id);
  let previous: BorrowerProfileDocument | null;
  try {
    previous = await collections.borrowerProfiles().findOneAndUpdate(
      { _id: profile._id },
      { $set: { salarySlip: slip, updatedAt: new Date() } },
      { returnDocument: 'before' },
    );
  } catch (error) {
    await deleteStoredFile(slip.fileId);
    throw error;
  }

  if (previous?.salarySlip) {
    await deleteIfUnreferenced(previous.salarySlip);
  }
  return toSalarySlipDto(slip);
}

/** A replaced slip is only deleted if no past loan still points at it. */
async function deleteIfUnreferenced(slip: SalarySlipMeta): Promise<void> {
  const referencedByLoan = await collections.loans().countDocuments(
    { 'salarySlip.fileId': slip.fileId },
    { limit: 1 },
  );
  if (referencedByLoan === 0) {
    await deleteStoredFile(slip.fileId);
  }
}

export async function openOwnSalarySlip(
  userId: ObjectId,
): Promise<{ meta: SalarySlipMeta; stream: GridFSBucketReadStream }> {
  const profile = await findProfileByUserId(userId);
  if (!profile?.salarySlip) {
    throw AppError.notFound('You have not uploaded a salary slip yet.');
  }
  return { meta: profile.salarySlip, stream: await openStoredFile(profile.salarySlip.fileId) };
}
