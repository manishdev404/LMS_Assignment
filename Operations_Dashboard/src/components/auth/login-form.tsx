'use client';

import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/context/auth-context';
import { errorMessage } from '@/lib/api';
import { navigateWithNewSession } from '@/lib/navigation';
import { homePathFor, ROLE_LABELS } from '@/lib/rbac';
import { safeNextPath } from '@/lib/session';
import type { StaffRole } from '@/types/api';

/** Accounts created by `npm run seed` in backend/. Only shown when explicitly enabled. */
const DEMO_ACCOUNTS: ReadonlyArray<{ role: StaffRole; email: string; password: string }> = [
  { role: 'ADMIN', email: 'admin@lms.dev', password: 'Admin@123' },
  { role: 'SALES', email: 'sales@lms.dev', password: 'Sales@123' },
  { role: 'SANCTION', email: 'sanction@lms.dev', password: 'Sanction@123' },
  { role: 'DISBURSEMENT', email: 'disbursement@lms.dev', password: 'Disburse@123' },
  { role: 'COLLECTION', email: 'collection@lms.dev', password: 'Collect@123' },
];

const SHOW_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true';

export function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signIn(credentials: { email: string; password: string }) {
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(credentials.email, credentials.password);
      navigateWithNewSession(safeNextPath(searchParams.get('next'), homePathFor(user.role)));
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void signIn({ email, password });
  }

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field id="email" label="Work email">
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@lms.dev"
          />
        </Field>
        <Field id="password" label="Password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" loading={submitting} disabled={!email || !password}>
          Sign in
        </Button>
      </form>

      {SHOW_DEMO_ACCOUNTS && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">Demo accounts</p>
          <p className="text-xs text-slate-500">One click signs in with the seeded credentials.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  void signIn(account);
                }}
                className="rounded-lg bg-slate-50 px-3 py-2 text-left ring-1 ring-slate-200 transition hover:bg-brand-50 hover:ring-brand-300 disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-slate-800">{ROLE_LABELS[account.role]}</span>
                <span className="block truncate text-[11px] text-slate-500">{account.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
