'use client';

import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { canAccess, getModule, type ModuleKey } from '@/lib/rbac';

/**
 * Second frontend RBAC layer (after proxy.ts): the role comes from /auth/staff/me, which the API
 * verified, so a tampered cookie that slipped past the proxy still renders nothing sensitive.
 */
export function RequireRole({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;

  if (!canAccess(user.role, module)) {
    return <AccessDenied moduleLabel={getModule(module).label} />;
  }
  return children;
}

export function AccessDenied({ moduleLabel }: { moduleLabel?: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
      <p className="text-sm font-semibold text-rose-600">403 · Access denied</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">
        {moduleLabel ? `You don't have access to ${moduleLabel}` : "You don't have access to this page"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Each team can only open its own module. Ask an administrator if you need access.
      </p>
      <ButtonLink href="/" className="mt-6">
        Go to my module
      </ButtonLink>
    </Card>
  );
}
