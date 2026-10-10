import { NextResponse, type NextRequest } from 'next/server';
import { readSessionClaims, SESSION_COOKIE } from '@/lib/session';

const PROTECTED_PREFIXES = ['/apply', '/my-loans'];
const GUEST_ONLY_PATHS = ['/login', '/register'];

/**
 * Optimistic route protection (runs before rendering, no DB call):
 *  - protected pages need a non-expired BORROWER session cookie, else → /login?next=…
 *  - signed-in borrowers visiting /login or /register → /apply
 * The backend remains the source of truth and rejects any request without a valid session.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const claims = readSessionClaims(request.cookies.get(SESSION_COOKIE)?.value);
  const isBorrower = claims?.role === 'BORROWER' && claims.aud === 'borrower';

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (isProtected && !isBorrower) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (GUEST_ONLY_PATHS.includes(pathname) && isBorrower) {
    return NextResponse.redirect(new URL('/apply', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/apply/:path*', '/my-loans/:path*', '/login', '/register'],
};
