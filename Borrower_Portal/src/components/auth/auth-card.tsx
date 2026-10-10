import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-20">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
      <p className="mt-6 text-center text-sm text-slate-600">{footer}</p>
    </div>
  );
}
