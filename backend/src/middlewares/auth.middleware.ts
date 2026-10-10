import type { Request, RequestHandler } from 'express';
import { PORTAL_CONFIG, type Portal } from '../constants/auth';
import type { Role } from '../constants/roles';
import type { AuthUser } from '../interfaces/auth.interface';
import { findUserById } from '../services/auth.service';
import { AppError } from '../utils/app-error';
import { verifyAccessToken } from '../utils/jwt';
import { readSessionToken } from '../utils/session-cookie';
import { toObjectId } from '../utils/mongo';

/**
 * 401 when there is no valid session for the given portal.
 * The user is re-loaded from the database so deleted users / changed roles apply immediately.
 */
export function authenticate(portal: Portal): RequestHandler {
  return async (req, _res, next) => {
    const token = readSessionToken(req, portal);
    if (!token) {
      throw AppError.unauthorized('Please sign in to continue.');
    }

    const claims = verifyAccessToken(token, portal);
    if (!/^[a-f\d]{24}$/i.test(claims.sub)) {
      throw AppError.unauthorized('Invalid session. Please sign in again.', 'INVALID_TOKEN');
    }

    const user = await findUserById(toObjectId(claims.sub));
    if (!user || !PORTAL_CONFIG[portal].allowedRoles.includes(user.role)) {
      throw AppError.unauthorized('Your session is no longer valid. Please sign in again.', 'INVALID_TOKEN');
    }

    req.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    next();
  };
}

/** RBAC: 403 when the authenticated user's role is not in `allowedRoles`. */
export function authorize(...allowedRoles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    const user = requireUser(req);
    if (!allowedRoles.includes(user.role)) {
      throw AppError.forbidden('You do not have permission to access this resource.');
    }
    next();
  };
}

/** For handlers mounted behind `authenticate` — narrows `req.user` without a non-null assertion. */
export function requireUser(req: Pick<Request, 'user'>): AuthUser {
  if (!req.user) {
    throw AppError.unauthorized('Please sign in to continue.');
  }
  return req.user;
}
