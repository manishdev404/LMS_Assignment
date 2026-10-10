import { rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/app-error';

/** Brute-force protection for login / sign-up. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, 'RATE_LIMITED', 'Too many attempts. Please try again in a few minutes.'));
  },
});
