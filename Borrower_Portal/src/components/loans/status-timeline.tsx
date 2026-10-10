import { CheckIcon, XIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import type { Loan, LoanStatus } from '@/types/api';

const HAPPY_PATH: LoanStatus[] = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];

const LABELS: Record<LoanStatus, string> = {
  APPLIED: 'Applied',
  SANCTIONED: 'Sanctioned',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
  CLOSED: 'Closed',
};

export function StatusTimeline({ loan }: { loan: Loan }) {
  const steps = loan.status === 'REJECTED' ? (['APPLIED', 'REJECTED'] as LoanStatus[]) : HAPPY_PATH;
  const reachedAt = (status: LoanStatus) => loan.statusHistory.find((entry) => entry.status === status)?.at;

  return (
    <ol className={cn('grid gap-2', steps.length === 2 ? 'grid-cols-2' : 'grid-cols-4')}>
      {steps.map((status) => {
        const at = reachedAt(status);
        const reached = Boolean(at);
        const rejected = status === 'REJECTED';
        return (
          <li key={status} className="flex flex-col items-start gap-1.5">
            <div className="flex w-full items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  rejected ? 'bg-rose-600 text-white' : reached ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-400',
                )}
              >
                {rejected ? <XIcon className="size-3.5" /> : reached ? <CheckIcon className="size-3.5" /> : null}
              </span>
              <span className={cn('h-0.5 flex-1 rounded', reached ? 'bg-brand-200' : 'bg-slate-200')} />
            </div>
            <span className={cn('text-xs font-semibold', reached ? 'text-slate-800' : 'text-slate-400')}>
              {LABELS[status]}
            </span>
            <span className="text-[11px] text-slate-500">{at ? formatDate(at) : 'Pending'}</span>
          </li>
        );
      })}
    </ol>
  );
}
