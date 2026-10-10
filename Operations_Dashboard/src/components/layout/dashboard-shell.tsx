'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { LogoMark, LogOutIcon, MenuIcon, XIcon } from '@/components/ui/icons';
import { PageLoader } from '@/components/ui/spinner';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/cn';
import { modulesFor, ROLE_LABELS } from '@/lib/rbac';
import type { User } from '@/types/api';
import { ModuleIcon } from './module-icon';

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // A cookie that the API no longer accepts: clear it and go back to the login page.
  useEffect(() => {
    if (status === 'anonymous') void logout();
  }, [status, logout]);

  if (!user) return <PageLoader label="Loading your workspace…" />;

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarContent user={user} onSignOut={() => void logout()} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85%] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Close navigation"
            >
              <XIcon className="size-5" />
            </button>
            <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} onSignOut={() => void logout()} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <MenuIcon className="size-5" />
        </button>
        <LogoMark className="size-7" />
        <span className="font-semibold text-slate-900">LMS Operations</span>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}

interface SidebarContentProps {
  user: User;
  onSignOut: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ user, onSignOut, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const modules = modulesFor(user.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <LogoMark className="size-8" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">LMS Operations</p>
          <p className="text-xs text-slate-500">Loan Management System</p>
        </div>
      </div>

      <nav aria-label="Modules" className="flex-1 space-y-1 p-3">
        <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Modules</p>
        {modules.map((module) => {
          const active = pathname === module.path || pathname.startsWith(`${module.path}/`);
          return (
            <Link
              key={module.key}
              href={module.path}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <ModuleIcon module={module.key} className="size-5" />
              {module.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role]} · {user.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOutIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
