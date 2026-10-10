import { cn } from '@/lib/cn';
import type { LoanStatus } from '@/types/api';

const STYLES: Record<LoanStatus, { label: string; className: string }> = {
  APPLIED: { label: 'Under review', className: 'bg-sky-50 text-sky-700 ring-sky-600/20' },
  SANCTIONED: { label: 'Approved', className: 'bg-amber-50 text-amber-800 ring-amber-600/20' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 ring-rose-600/20' },
  DISBURSED: { label: 'Active', className: 'bg-violet-50 text-violet-700 ring-violet-600/20' },
  CLOSED: { label: 'Closed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}
