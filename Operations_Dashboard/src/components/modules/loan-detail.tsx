import type { ReactNode } from 'react';
import { LoanStatusBadge } from '@/components/ui/badges';
import { EMPLOYMENT_LABELS, formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/rbac';
import type { Loan, Payment } from '@/types/api';

/** Full read-only view of a loan: applicant, money, audit trail and payments. */
export function LoanDetail({ loan, payments }: { loan: Loan; payments: Payment[] }) {
  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-base font-semibold text-slate-900">{loan.loanNumber}</span>
        <LoanStatusBadge status={loan.status} />
        <a
          href={`/api/sanction/loans/${loan.id}/salary-slip`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm font-medium text-brand-700 hover:underline"
        >
          Salary slip
        </a>
      </div>

      <Section title="Applicant">
        <Item label="Name" value={loan.applicant.fullName} />
        <Item label="Email" value={loan.applicant.email} />
        <Item label="PAN" value={loan.applicant.pan} />
        <Item label="Date of birth" value={`${formatDate(loan.applicant.dateOfBirth)} (age ${loan.applicant.age})`} />
        <Item label="Monthly salary" value={formatCurrency(loan.applicant.monthlySalary)} />
        <Item label="Employment" value={EMPLOYMENT_LABELS[loan.applicant.employmentMode]} />
      </Section>

      <Section title="Loan">
        <Item label="Principal" value={formatCurrency(loan.principal)} />
        <Item label="Tenure" value={`${loan.tenureDays} days @ ${loan.interestRatePa}% p.a.`} />
        <Item label="Simple interest" value={formatCurrency(loan.simpleInterest, true)} />
        <Item label="Total repayment" value={formatCurrency(loan.totalRepayment, true)} />
        <Item label="Paid" value={formatCurrency(loan.amountPaid, true)} />
        <Item label="Outstanding" value={formatCurrency(loan.outstanding, true)} />
      </Section>

      {loan.rejectionReason && (
        <p className="rounded-lg bg-rose-50 p-3 text-rose-800 ring-1 ring-rose-200">
          <span className="font-semibold">Rejection reason:</span> {loan.rejectionReason}
        </p>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Status history</h3>
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
          {loan.statusHistory.map((entry) => (
            <li key={`${entry.status}-${entry.at}`} className="relative">
              <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
              <p className="font-medium text-slate-900">
                {entry.status} <span className="font-normal text-slate-500">· {formatDateTime(entry.at)}</span>
              </p>
              <p className="text-xs text-slate-500">
                by {entry.by.name} ({ROLE_LABELS[entry.by.role]})
                {entry.note ? ` — ${entry.note}` : ''}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <PaymentHistory payments={payments} />
    </div>
  );
}

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Payments ({payments.length})
      </h3>
      {payments.length === 0 ? (
        <p className="text-slate-500">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">UTR</th>
                <th className="px-3 py-2 font-medium">Recorded by</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-3 py-2">{formatDate(payment.paymentDate)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{payment.utr}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">{payment.recordedBy.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(payment.amount, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}
