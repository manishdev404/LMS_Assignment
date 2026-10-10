import jwt from 'jsonwebtoken';
import type { ObjectId } from 'mongodb';
import { env } from '../config/env';
import { JWT_ISSUER, type Portal } from '../constants/auth';
import { isRole, type Role } from '../constants/roles';
import type { AccessTokenClaims } from '../interfaces/auth.interface';
import { AppError } from './app-error';

export function signAccessToken(user: { _id: ObjectId; role: Role }, portal: Portal): string {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user._id.toHexString(),
    audience: portal,
    issuer: JWT_ISSUER,
    expiresIn: env.JWT_EXPIRES_IN_HOURS * 60 * 60,
  });
}

/** Verifies signature, expiry, issuer and audience (a borrower token is useless on staff routes). */
export function verifyAccessToken(token: string, portal: Portal): AccessTokenClaims {
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      audience: portal,
      issuer: JWT_ISSUER,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Your session has expired. Please sign in again.', 'SESSION_EXPIRED');
    }
    throw AppError.unauthorized('Invalid session. Please sign in again.', 'INVALID_TOKEN');
  }

  if (typeof decoded === 'string' || !decoded.sub || !isRole(decoded['role'])) {
    throw AppError.unauthorized('Invalid session. Please sign in again.', 'INVALID_TOKEN');
  }

  return { sub: decoded.sub, role: decoded['role'], aud: portal };
}

export function getTokenTtlMs(): number {
  return env.JWT_EXPIRES_IN_HOURS * 60 * 60 * 1000;
}
