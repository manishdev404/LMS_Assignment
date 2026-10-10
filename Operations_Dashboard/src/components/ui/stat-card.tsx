import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, hint, active, onClick }: StatCardProps) {
  const content = (
    <>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </>
  );
  const className = cn(
    'rounded-2xl bg-white p-4 text-left shadow-sm ring-1 transition',
    active ? 'ring-2 ring-brand-500' : 'ring-slate-200',
    onClick && 'hover:ring-brand-300',
  );

  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
