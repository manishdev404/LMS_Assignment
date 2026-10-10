import { ObjectId } from 'mongodb';
import { PORTAL_CONFIG, type Portal } from '../constants/auth';
import { ROLES } from '../constants/roles';
import { collections } from '../db/collections';
import type { AuthResult, LoginInput, RegisterInput } from '../interfaces/auth.interface';
import type { UserDocument } from '../interfaces/user.interface';
import { AppError } from '../utils/app-error';
import { signAccessToken } from '../utils/jwt';
import { toUserDto } from '../utils/mappers';
import { isDuplicateKeyError } from '../utils/mongo';
import { hashPassword, TIMING_SAFE_DUMMY_HASH, verifyPassword } from '../utils/password';

const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists. Please sign in instead.';

/** Self sign-up is only for borrowers — roles are never taken from the client. */
export async function registerBorrower(input: RegisterInput): Promise<AuthResult> {
  const existing = await collections.users().findOne({ email: input.email }, { projection: { _id: 1 } });
  if (existing) {
    throw AppError.conflict(EMAIL_TAKEN_MESSAGE, 'EMAIL_TAKEN');
  }

  const now = new Date();
  const user: UserDocument = {
    _id: new ObjectId(),
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: ROLES.BORROWER,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await collections.users().insertOne(user);
  } catch (error) {
    if (isDuplicateKeyError(error, 'email')) {
      throw AppError.conflict(EMAIL_TAKEN_MESSAGE, 'EMAIL_TAKEN');
    }
    throw error;
  }

  return { user: toUserDto(user), token: signAccessToken(user, 'borrower') };
}

export async function login(portal: Portal, input: LoginInput): Promise<AuthResult> {
  const user = await collections.users().findOne({ email: input.email });
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash ?? TIMING_SAFE_DUMMY_HASH);

  if (!user || !passwordMatches) {
    throw AppError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (!PORTAL_CONFIG[portal].allowedRoles.includes(user.role)) {
    const correctApp = portal === 'borrower' ? PORTAL_CONFIG.staff.appName : PORTAL_CONFIG.borrower.appName;
    throw AppError.forbidden(
      `This account cannot sign in here. Please use the ${correctApp}.`,
      'WRONG_PORTAL',
    );
  }

  return { user: toUserDto(user), token: signAccessToken(user, portal) };
}

export function findUserById(id: ObjectId): Promise<UserDocument | null> {
  return collections.users().findOne({ _id: id });
}
