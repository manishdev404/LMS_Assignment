'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoanStatusBadge } from '@/components/ui/status-badge';
import { apiRequest, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Loan, Payment } from '@/types/api';
import { StatusTimeline } from './status-timeline';

const STATUS_MESSAGES: Partial<Record<Loan['status'], string>> = {
  APPLIED: 'Your application is being reviewed by our sanction team.',
  SANCTIONED: 'Approved! Funds will be released to your account shortly.',
  DISBURSED: 'Funds have been released. Repay the outstanding amount before the due date.',
  CLOSED: 'Fully repaid — thank you!',
};

export function LoanCard({ loan }: { loan: Loan }) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [showPayments, setShowPayments] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const hasRepayments = loan.status === 'DISBURSED' || loan.status === 'CLOSED';
  const paidPercent = loan.totalRepayment > 0 ? Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100) : 0;

  async function togglePayments() {
    const next = !showPayments;
    setShowPayments(next);
    if (!next || payments) return;
    setLoadingPayments(true);
    setPaymentsError(null);
    try {
      const result = await apiRequest<{ payments: Payment[] }>(`/borrower/loans/${loan.id}`);
      setPayments(result.payments);
    } catch (err) {
      setPaymentsError(errorMessage(err));
    } finally {
      setLoadingPayments(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-slate-900">{loan.loanNumber}</p>
          <p className="text-xs text-slate-500">Applied on {formatDate(loan.createdAt)}</p>
        </div>
        <LoanStatusBadge status={loan.status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label="Amount" value={formatCurrency(loan.principal)} />
        <Figure label="Tenure" value={`${loan.tenureDays} days`} />
        <Figure label="Interest (12% p.a.)" value={formatCurrency(loan.simpleInterest, true)} />
        <Figure label="Total repayment" value={formatCurrency(loan.totalRepayment, true)} />
      </dl>

      <div className="mt-6">
        <StatusTimeline loan={loan} />
      </div>

      {loan.status === 'REJECTED' ? (
        <Alert tone="error" title="Application rejected" className="mt-5">
          {loan.rejectionReason}
        </Alert>
      ) : (
        STATUS_MESSAGES[loan.status] && <p className="mt-5 text-sm text-slate-600">{STATUS_MESSAGES[loan.status]}</p>
      )}

      {hasRepayments && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-slate-600">
              Paid <strong className="text-slate-900">{formatCurrency(loan.amountPaid, true)}</strong> of{' '}
              {formatCurrency(loan.totalRepayment, true)}
            </span>
            <span className="text-slate-600">
              Outstanding <strong className="text-slate-900">{formatCurrency(loan.outstanding, true)}</strong>
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={Math.round(paidPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Repayment progress"
          >
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPercent}%` }} />
          </div>
          <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={() => void togglePayments()}>
            {showPayments ? 'Hide payments' : 'Show payments'}
          </Button>
          {showPayments && (
            <PaymentsTable payments={payments} loading={loadingPayments} error={paymentsError} />
          )}
        </div>
      )}
    </Card>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

function PaymentsTable({ payments, loading, error }: { payments: Payment[] | null; loading: boolean; error: string | null }) {
  if (loading) return <p className="mt-2 text-sm text-slate-500">Loading payments…</p>;
  if (error) return <p className="mt-2 text-sm text-rose-600">{error}</p>;
  if (!payments?.length) return <p className="mt-2 text-sm text-slate-500">No payments recorded yet.</p>;

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">UTR</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="py-2">{formatDate(payment.paymentDate)}</td>
              <td className="py-2 font-mono text-xs">{payment.utr}</td>
              <td className="py-2 text-right tabular-nums">{formatCurrency(payment.amount, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
