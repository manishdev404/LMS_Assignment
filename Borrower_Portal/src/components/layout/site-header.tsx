'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, ButtonLink } from '@/components/ui/button';
import { LogoMark } from '@/components/ui/icons';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { href: '/apply', label: 'Apply' },
  { href: '/my-loans', label: 'My loans' },
];

export function SiteHeader() {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
          <LogoMark className="size-8" />
          <span className="hidden sm:inline">LMS Borrower Portal</span>
        </Link>

        {user && (
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {status === 'loading' ? null : user ? (
            <>
              <span className="hidden text-sm text-slate-600 md:inline">
                Hi, <span className="font-medium text-slate-900">{user.name.split(' ')[0]}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Create account
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
