import { NextResponse, type NextRequest } from 'next/server';
import { homePathFor, isStaffRole, moduleForPath } from '@/lib/rbac';
import { readSessionClaims, SESSION_COOKIE } from '@/lib/session';

/**
 * Optimistic RBAC before rendering (cookie only, no DB call):
 *  - no / expired staff session        → /login?next=…
 *  - signed in, visiting / or /login   → the role's home module
 *  - module not allowed for the role   → /forbidden
 * The API enforces the same rules independently (401 / 403).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const claims = readSessionClaims(request.cookies.get(SESSION_COOKIE)?.value);
  const role = claims?.aud === 'staff' && isStaffRole(claims.role) ? claims.role : null;

  if (pathname === '/login') {
    return role ? NextResponse.redirect(new URL(homePathFor(role), request.url)) : NextResponse.next();
  }

  if (!role) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(homePathFor(role), request.url));
  }

  const targetModule = moduleForPath(pathname);
  if (targetModule && !targetModule.roles.includes(role)) {
    const forbiddenUrl = new URL('/forbidden', request.url);
    forbiddenUrl.searchParams.set('from', targetModule.label);
    return NextResponse.redirect(forbiddenUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/forbidden',
    '/overview/:path*',
    '/sales/:path*',
    '/sanction/:path*',
    '/disbursement/:path*',
    '/collection/:path*',
  ],
};
