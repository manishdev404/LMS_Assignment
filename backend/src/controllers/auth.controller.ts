import type { Request, RequestHandler, Response } from 'express';
import type { Portal } from '../constants/auth';
import type { LoginInput, RegisterInput } from '../interfaces/auth.interface';
import { requireUser } from '../middlewares/auth.middleware';
import { validatedHandler } from '../middlewares/validate.middleware';
import * as authService from '../services/auth.service';
import { sendNoContent, sendSuccess } from '../utils/api-response';
import { AppError } from '../utils/app-error';
import { toUserDto } from '../utils/mappers';
import { clearSessionCookie, setSessionCookie } from '../utils/session-cookie';

export const registerBorrower = validatedHandler<{ body: RegisterInput }>(async (req, res) => {
  const result = await authService.registerBorrower(req.body);
  setSessionCookie(res, 'borrower', result.token);
  sendSuccess(res, result, 201);
});

export function login(portal: Portal): RequestHandler {
  return validatedHandler<{ body: LoginInput }>(async (req, res) => {
    const result = await authService.login(portal, req.body);
    setSessionCookie(res, portal, result.token);
    sendSuccess(res, result);
  });
}

export function logout(portal: Portal): RequestHandler {
  return (_req, res) => {
    clearSessionCookie(res, portal);
    sendNoContent(res);
  };
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.findUserById(requireUser(req).id);
  if (!user) {
    throw AppError.unauthorized('Your session is no longer valid. Please sign in again.', 'INVALID_TOKEN');
  }
  sendSuccess(res, { user: toUserDto(user) });
}
