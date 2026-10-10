import bcrypt from 'bcryptjs';
import { BCRYPT_SALT_ROUNDS } from '../constants/auth';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Compared against when the email does not exist, so a login attempt takes the same time
 * whether or not the account exists (prevents user enumeration by timing).
 */
export const TIMING_SAFE_DUMMY_HASH = bcrypt.hashSync('timing-safe-dummy-password', BCRYPT_SALT_ROUNDS);
