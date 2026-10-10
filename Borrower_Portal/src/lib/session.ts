import type { Role } from '@/types/api';

export const SESSION_COOKIE = 'lms_borrower_session';

export interface SessionClaims {
  sub: string;
  role: Role;
  aud: string;
  exp: number;
}

/**
 * Decodes the JWT payload WITHOUT verifying the signature. This is only an optimistic check for
 * routing in proxy.ts; the backend verifies the signature on every API call.
 */
export function readSessionClaims(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const claims = JSON.parse(json) as Partial<SessionClaims>;
    if (!claims.sub || !claims.role || typeof claims.exp !== 'number') return null;
    if (claims.exp * 1000 <= Date.now()) return null;
    return claims as SessionClaims;
  } catch {
    return null;
  }
}

/** Only allow same-site relative redirects (prevents open-redirects via ?next=). */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
