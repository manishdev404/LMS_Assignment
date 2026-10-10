'use client';

import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/context/auth-context';
import { errorMessage } from '@/lib/api';
import { navigateWithNewSession } from '@/lib/navigation';
import { safeNextPath } from '@/lib/session';

/**
 * Borrowers created by `npm run seed` (the clean account) and `npm run seed:demo` (one per
 * lifecycle stage) in backend/. Only shown when explicitly enabled.
 */
const DEMO_PASSWORD = 'Borrower@123';
const DEMO_ACCOUNTS: ReadonlyArray<{ name: string; stage: string; email: string }> = [
  { name: 'Bhavna Borrower', stage: 'Fresh account', email: 'borrower@lms.dev' },
  { name: 'Nikhil New', stage: 'Registered', email: 'lead.new@lms.dev' },
  { name: 'Rohan Rejected', stage: 'BRE rejected', email: 'lead.rejected@lms.dev' },
  { name: 'Riya Ready', stage: 'Docs uploaded', email: 'lead.ready@lms.dev' },
  { name: 'Arjun Applied', stage: 'Applied', email: 'applied@lms.dev' },
  { name: 'Sara Sanctioned', stage: 'Sanctioned', email: 'sanctioned@lms.dev' },
  { name: 'Aditya Active', stage: 'Disbursed', email: 'active@lms.dev' },
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
      await login(credentials.email, credentials.password);
      navigateWithNewSession(safeNextPath(searchParams.get('next'), '/apply'));
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field id="email" label="Email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field id="password" label="Password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" loading={submitting} disabled={!email || !password}>
          Sign in
        </Button>
      </form>

      {SHOW_DEMO_ACCOUNTS && (
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">Demo accounts</p>
          <p className="text-xs text-slate-500">One click signs in with the seeded credentials.</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  void signIn({ email: account.email, password: DEMO_PASSWORD });
                }}
                className="rounded-lg bg-white px-3 py-2 text-left ring-1 ring-slate-200 transition hover:bg-brand-50 hover:ring-brand-300 disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-slate-800">{account.name}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {account.stage} · {account.email}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
