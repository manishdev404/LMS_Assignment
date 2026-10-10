'use client';

import { useEffect, useState } from 'react';
import { LoanCard } from '@/components/loans/loan-card';
import { Alert } from '@/components/ui/alert';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { apiRequest, errorMessage } from '@/lib/api';
import type { Loan } from '@/types/api';

const ACTIVE_STATUSES: Loan['status'][] = ['APPLIED', 'SANCTIONED', 'DISBURSED'];

export default function MyLoansPage() {
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<{ items: Loan[] }>('/borrower/loans')
      .then((result) => {
        if (!cancelled) setLoans(result.items);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Alert tone="error" title="Could not load your loans">
          {error}
        </Alert>
      </div>
    );
  }
  if (!loans) return <PageLoader label="Loading your loans…" />;

  const hasActiveLoan = loans.some((loan) => ACTIVE_STATUSES.includes(loan.status));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My loans</h1>
          <p className="text-sm text-slate-600">Track the status and repayments of your loans.</p>
        </div>
        {!hasActiveLoan && loans.length > 0 && <ButtonLink href="/apply">Apply for a new loan</ButtonLink>}
      </div>

      {loans.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No loans yet</h2>
          <p className="mt-1 text-sm text-slate-600">Complete your application to see it here.</p>
          <ButtonLink href="/apply" className="mt-6">
            Start application
          </ButtonLink>
        </Card>
      ) : (
        <div className="space-y-5">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </div>
  );
}
