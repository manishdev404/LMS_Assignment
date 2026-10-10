'use client';

import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { errorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Loan } from '@/types/api';

interface NoteConfig {
  label: string;
  placeholder?: string;
  /** When set, a note of at least this many characters is required. */
  minLength?: number;
}

interface LoanActionDialogProps {
  loan: Loan;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  note: NoteConfig;
  onConfirm: (note: string) => Promise<void>;
  onClose: () => void;
}

/** Confirmation dialog shared by approve / reject / disburse. */
export function LoanActionDialog({
  loan,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  note,
  onConfirm,
  onClose,
}: LoanActionDialogProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const required = note.minLength !== undefined;
  const tooShort = required && value.trim().length < (note.minLength ?? 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tooShort) {
      setError(`${note.label} must be at least ${note.minLength} characters.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(value.trim());
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal open title={title} description={description} onClose={submitting ? () => undefined : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
          <SummaryItem label="Loan" value={loan.loanNumber} mono />
          <SummaryItem label="Borrower" value={loan.applicant.fullName} />
          <SummaryItem label="Amount" value={formatCurrency(loan.principal)} />
          <SummaryItem label="Total repayment" value={formatCurrency(loan.totalRepayment, true)} />
        </dl>

        {error && <Alert tone="error">{error}</Alert>}

        <Field
          id="action-note"
          label={required ? note.label : `${note.label} (optional)`}
          hint={required ? `At least ${note.minLength} characters` : undefined}
        >
          <Textarea
            id="action-note"
            value={value}
            maxLength={500}
            placeholder={note.placeholder}
            onChange={(event) => setValue(event.target.value)}
            invalid={!!error && tooShort}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant={tone === 'danger' ? 'danger' : 'primary'} loading={submitting}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SummaryItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={mono ? 'font-mono font-semibold text-slate-900' : 'font-semibold text-slate-900'}>{value}</dd>
    </div>
  );
}
