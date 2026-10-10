import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckIcon, InfoIcon } from '@/components/ui/icons';
import { LoanStatusBadge } from '@/components/ui/status-badge';
import { formatCurrency } from '@/lib/format';
import type { Loan } from '@/types/api';

function LoanFigures({ loan }: { loan: Loan }) {
  const figures = [
    { label: 'Amount', value: formatCurrency(loan.principal) },
    { label: 'Tenure', value: `${loan.tenureDays} days` },
    { label: 'Interest', value: formatCurrency(loan.simpleInterest, true) },
    { label: 'Total repayment', value: formatCurrency(loan.totalRepayment, true) },
  ];
  return (
    <dl className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <dt className="text-xs text-slate-500">{figure.label}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-900">{figure.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ApplicationSubmitted({ loan }: { loan: Loan }) {
  return (
    <Card className="p-6 text-center sm:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckIcon className="size-7" />
      </span>
      <h2 className="mt-4 text-2xl font-bold text-slate-900">Application submitted</h2>
      <p className="mt-2 text-slate-600">
        Your application <span className="font-semibold text-slate-900">{loan.loanNumber}</span> is now under
        review. We will update its status here as it progresses.
      </p>
      <LoanFigures loan={loan} />
      <ButtonLink href="/my-loans" className="mt-8">
        Track my application
      </ButtonLink>
    </Card>
  );
}

export function ActiveLoanNotice({ loan }: { loan: Loan }) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <InfoIcon className="size-6" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">You already have an active loan</h2>
            <LoanStatusBadge status={loan.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Loan <span className="font-semibold">{loan.loanNumber}</span> is in progress. You can apply for a new
            loan once it is closed.
          </p>
        </div>
      </div>
      <LoanFigures loan={loan} />
      <ButtonLink href="/my-loans" className="mt-6">
        View loan status
      </ButtonLink>
    </Card>
  );
}
