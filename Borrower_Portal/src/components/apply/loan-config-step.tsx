'use client';

import { useMemo, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { apiRequest, errorMessage } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateLoanQuote } from '@/lib/loan-math';
import type { ApplicationConfig, Loan } from '@/types/api';
import { RangeField } from './range-field';

interface LoanConfigStepProps {
  config: ApplicationConfig['loan'];
  onBack: () => void;
  onApplied: (loan: Loan) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function LoanConfigStep({ config, onBack, onApplied }: LoanConfigStepProps) {
  const [principal, setPrincipal] = useState(() => clamp(100_000, config.minPrincipal, config.maxPrincipal));
  const [tenureDays, setTenureDays] = useState(() => clamp(90, config.minTenureDays, config.maxTenureDays));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const quote = useMemo(
    () => calculateLoanQuote(principal, tenureDays, config.interestRatePa),
    [principal, tenureDays, config.interestRatePa],
  );
  const dueDate = new Date(now + tenureDays * DAY_MS).toISOString();

  async function handleApply() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiRequest<{ loan: Loan }>('/borrower/loans', {
        method: 'POST',
        body: { principal, tenureDays },
      });
      onApplied(result.loan);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Choose your loan</h2>
        <p className="text-sm text-slate-600">
          Fixed {config.interestRatePa}% p.a. simple interest. Your repayment updates as you move the sliders.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <RangeField
            id="principal"
            label="Loan amount"
            value={principal}
            min={config.minPrincipal}
            max={config.maxPrincipal}
            step={config.principalStep}
            onChange={setPrincipal}
            format={(value) => formatCurrency(value)}
          />
          <RangeField
            id="tenure"
            label="Tenure"
            value={tenureDays}
            min={config.minTenureDays}
            max={config.maxTenureDays}
            step={1}
            onChange={setTenureDays}
            format={(value) => `${value} days`}
          />
        </div>

        <section
          aria-live="polite"
          aria-label="Repayment summary"
          className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg"
        >
          <h3 className="text-sm font-medium text-brand-100">Repayment summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryRow label="Principal" value={formatCurrency(quote.principal, true)} />
            <SummaryRow label="Interest rate" value={`${quote.interestRatePa}% p.a.`} />
            <SummaryRow label="Tenure" value={`${quote.tenureDays} days`} />
            <SummaryRow label="Simple interest" value={formatCurrency(quote.simpleInterest, true)} />
          </dl>
          <div className="mt-5 border-t border-white/20 pt-4">
            <p className="text-xs uppercase tracking-wide text-brand-200">Total repayment</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{formatCurrency(quote.totalRepayment, true)}</p>
            <p className="mt-1 text-xs text-brand-200">Due by about {formatDate(dueDate)}</p>
          </div>
          <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 font-mono text-[11px] text-brand-100">
            SI = (P × R × T) / (365 × 100)
          </p>
        </section>
      </div>

      <div className="flex justify-between border-t border-slate-100 pt-5">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={() => void handleApply()} loading={submitting}>
          Apply for {formatCurrency(principal)}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-brand-100">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
