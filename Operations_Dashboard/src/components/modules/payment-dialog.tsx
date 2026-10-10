'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { useApiQuery } from '@/hooks/use-api-query';
import { ApiError, apiRequest, errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Loan, LoanWithPayments, RecordPaymentResult } from '@/types/api';
import { PaymentHistory } from './loan-detail';

interface PaymentDialogProps {
  loan: Loan;
  onClose: () => void;
  onRecorded: (result: RecordPaymentResult) => void;
}

type FormErrors = Partial<Record<'utr' | 'amount' | 'paymentDate', string>>;

function localIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function PaymentDialog({ loan, onClose, onRecorded }: PaymentDialogProps) {
  const canRecord = loan.status === 'DISBURSED';
  const history = useApiQuery<LoanWithPayments>(`/collection/loans/${loan.id}/payments`);
  const [today] = useState(() => localIsoDate(new Date()));
  const minDate = loan.disbursedAt ? localIsoDate(new Date(loan.disbursedAt)) : undefined;

  const [utr, setUtr] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(today);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FormErrors {
    const next: FormErrors = {};
    const numeric = Number(amount);
    if (!/^[A-Za-z0-9]{12,22}$/.test(utr.trim())) next.utr = 'UTR must be 12–22 letters or digits';
    if (amount.trim() === '' || Number.isNaN(numeric) || numeric <= 0) next.amount = 'Enter an amount greater than zero';
    else if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) next.amount = 'Use at most 2 decimal places';
    else if (numeric > loan.outstanding) next.amount = `Cannot exceed outstanding ${formatCurrency(loan.outstanding, true)}`;
    if (!paymentDate) next.paymentDate = 'Choose the payment date';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await apiRequest<RecordPaymentResult>(`/collection/loans/${loan.id}/payments`, {
        method: 'POST',
        body: { utr: utr.trim().toUpperCase(), amount: Number(amount), paymentDate },
      });
      onRecorded(result);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
      else setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      title={canRecord ? `Record payment · ${loan.loanNumber}` : `Payments · ${loan.loanNumber}`}
      description={`${loan.applicant.fullName} · ${loan.applicant.email}`}
      onClose={submitting ? () => undefined : onClose}
    >
      <div className="space-y-6">
        <dl className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
          <div>
            <dt className="text-xs text-slate-500">Total repayment</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(loan.totalRepayment, true)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Paid</dt>
            <dd className="font-semibold tabular-nums text-emerald-700">{formatCurrency(loan.amountPaid, true)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Outstanding</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(loan.outstanding, true)}</dd>
          </div>
        </dl>

        {canRecord && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {formError && <Alert tone="error">{formError}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="utr" label="UTR number" hint="Unique bank reference (12–22 characters)" error={errors.utr}>
                  <Input
                    id="utr"
                    value={utr}
                    maxLength={22}
                    spellCheck={false}
                    className="font-mono uppercase"
                    onChange={(event) => setUtr(event.target.value.toUpperCase())}
                    invalid={!!errors.utr}
                  />
                </Field>
              </div>
              <Field
                id="amount"
                label="Amount (₹)"
                error={errors.amount}
                hint={
                  <button
                    type="button"
                    className="font-medium text-brand-700 hover:underline"
                    onClick={() => setAmount(String(loan.outstanding))}
                  >
                    Pay full outstanding ({formatCurrency(loan.outstanding, true)})
                  </button>
                }
              >
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  invalid={!!errors.amount}
                />
              </Field>
              <Field id="paymentDate" label="Payment date" error={errors.paymentDate}>
                <Input
                  id="paymentDate"
                  type="date"
                  min={minDate}
                  max={today}
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  invalid={!!errors.paymentDate}
                />
              </Field>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Record payment
              </Button>
            </div>
          </form>
        )}

        {history.data ? (
          <PaymentHistory payments={history.data.payments} />
        ) : history.error ? (
          <p className="text-sm text-rose-600">{history.error}</p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="size-4" /> Loading payment history…
          </p>
        )}
      </div>
    </Modal>
  );
}
