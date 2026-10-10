import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { ModuleIcon } from '@/components/layout/module-icon';
import { LogoMark } from '@/components/ui/icons';
import { MODULES } from '@/lib/rbac';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <span className="text-lg font-semibold">LMS Operations</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold">One dashboard for the whole loan lifecycle.</h1>
          <ul className="mt-8 space-y-4">
            {MODULES.map((module) => (
              <li key={module.key} className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <ModuleIcon module={module.key} className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{module.label}</p>
                  <p className="text-sm text-brand-100">{module.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-200">Access is limited to your team&apos;s module.</p>
      </section>

      <section className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark className="size-9" />
            <span className="text-lg font-semibold text-slate-900">LMS Operations</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Staff sign in</h2>
          <p className="mt-1 text-sm text-slate-600">Use your work account to open your module.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
