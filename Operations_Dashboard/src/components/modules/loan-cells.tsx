import { ExternalLinkIcon } from '@/components/ui/icons';
import { EMPLOYMENT_LABELS, formatCurrency, formatDate } from '@/lib/format';
import type { Loan } from '@/types/api';

export function LoanRefCell({ loan, dateLabel, date }: { loan: Loan; dateLabel: string; date: string | null }) {
  return (
    <div>
      <p className="font-mono text-sm font-semibold text-slate-900">{loan.loanNumber}</p>
      <p className="text-xs text-slate-500">
        {dateLabel} {formatDate(date)}
      </p>
    </div>
  );
}

export function ApplicantCell({ loan, showPan = true }: { loan: Loan; showPan?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="font-medium text-slate-900">{loan.applicant.fullName}</p>
      <p className="truncate text-xs text-slate-500">{loan.applicant.email}</p>
      {showPan && <p className="font-mono text-xs text-slate-500">{loan.applicant.pan}</p>}
    </div>
  );
}

export function ApplicantProfileCell({ loan }: { loan: Loan }) {
  return (
    <div className="text-xs text-slate-600">
      <p>
        <span className="font-medium text-slate-900">{formatCurrency(loan.applicant.monthlySalary)}</span> / month
      </p>
      <p>{EMPLOYMENT_LABELS[loan.applicant.employmentMode]}</p>
      <p>Age {loan.applicant.age}</p>
    </div>
  );
}

export function LoanTermsCell({ loan }: { loan: Loan }) {
  return (
    <div>
      <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(loan.principal)}</p>
      <p className="text-xs text-slate-500">{loan.tenureDays} days @ {loan.interestRatePa}% p.a.</p>
    </div>
  );
}

export function RepaymentCell({ loan }: { loan: Loan }) {
  return (
    <div>
      <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(loan.totalRepayment, true)}</p>
      <p className="text-xs text-slate-500">SI {formatCurrency(loan.simpleInterest, true)}</p>
    </div>
  );
}

export function SalarySlipLink({ loan }: { loan: Loan }) {
  return (
    <a
      href={`/api/sanction/loans/${loan.id}/salary-slip`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
    >
      View <ExternalLinkIcon className="size-3.5" />
    </a>
  );
}

export function RepaymentProgress({ loan }: { loan: Loan }) {
  const percent = loan.totalRepayment > 0 ? Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100) : 0;
  return (
    <div className="min-w-40">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Paid {formatCurrency(loan.amountPaid, true)}</span>
        <span className="font-medium text-slate-700">{Math.floor(percent)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-600">
        Outstanding <span className="font-semibold text-slate-900">{formatCurrency(loan.outstanding, true)}</span>
      </p>
    </div>
  );
}
