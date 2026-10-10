import { Router } from 'express';
import { PORTALS } from '../constants/auth';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../validations/auth.validation';

export const authRoutes = Router();

authRoutes.post(
  '/borrower/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  authController.registerBorrower,
);

// Identical login / logout / me endpoints for each portal: /borrower/* and /staff/*
for (const portal of PORTALS) {
  authRoutes.post(`/${portal}/login`, authRateLimiter, validate({ body: loginSchema }), authController.login(portal));
  authRoutes.post(`/${portal}/logout`, authController.logout(portal));
  authRoutes.get(`/${portal}/me`, authenticate(portal), authController.me);
}
