import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env';
import { PORTAL_CONFIG, type Portal } from '../constants/auth';
import { getTokenTtlMs } from './jwt';

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  };
}

export function setSessionCookie(res: Response, portal: Portal, token: string): void {
  res.cookie(PORTAL_CONFIG[portal].cookieName, token, {
    ...baseCookieOptions(),
    maxAge: getTokenTtlMs(),
  });
}

export function clearSessionCookie(res: Response, portal: Portal): void {
  res.clearCookie(PORTAL_CONFIG[portal].cookieName, baseCookieOptions());
}

/** Bearer header first (API clients), then the portal's httpOnly cookie (browsers). */
export function readSessionToken(req: Request, portal: Portal): string | null {
  const header = req.get('authorization');
  if (header?.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim();
    if (token) return token;
  }

  const cookies: Record<string, unknown> = req.cookies ?? {};
  const cookieToken = cookies[PORTAL_CONFIG[portal].cookieName];
  return typeof cookieToken === 'string' && cookieToken ? cookieToken : null;
}
