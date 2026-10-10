'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ActiveLoanNotice, ApplicationSubmitted } from '@/components/apply/application-result';
import { LoanConfigStep } from '@/components/apply/loan-config-step';
import { PersonalDetailsStep } from '@/components/apply/personal-details-step';
import { SalarySlipStep } from '@/components/apply/salary-slip-step';
import { Stepper, type WizardStep } from '@/components/apply/stepper';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/spinner';
import { apiRequest, errorMessage } from '@/lib/api';
import type { ApplicationState, BorrowerProfile, Loan, SalarySlip } from '@/types/api';

/** The furthest step the borrower may open, derived from what the server has stored. */
function furthestStep(profile: BorrowerProfile | null): WizardStep {
  if (!profile?.bre.eligible) return 'PERSONAL_DETAILS';
  if (!profile.salarySlip) return 'SALARY_SLIP';
  return 'LOAN_CONFIG';
}

export default function ApplyPage() {
  const [state, setState] = useState<ApplicationState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>('PERSONAL_DETAILS');
  const [submittedLoan, setSubmittedLoan] = useState<Loan | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<ApplicationState>('/borrower/application')
      .then((data) => {
        if (cancelled) return;
        setState(data);
        if (data.nextStep !== 'TRACK_LOAN') setStep(data.nextStep);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = (change: (profile: BorrowerProfile) => BorrowerProfile) =>
    setState((current) => (current?.profile ? { ...current, profile: change(current.profile) } : current));

  if (loadError) {
    return (
      <PageShell>
        <Alert tone="error" title="Could not load your application">
          {loadError}
        </Alert>
        <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </PageShell>
    );
  }

  if (!state) return <PageLoader label="Loading your application…" />;

  if (submittedLoan) {
    return (
      <PageShell>
        <ApplicationSubmitted loan={submittedLoan} />
      </PageShell>
    );
  }

  if (state.activeLoan) {
    return (
      <PageShell>
        <ActiveLoanNotice loan={state.activeLoan} />
      </PageShell>
    );
  }

  const furthest = furthestStep(state.profile);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Loan application</h1>
        <p className="text-sm text-slate-600">It takes about 3 minutes. Your progress is saved after each step.</p>
      </div>
      <Stepper current={step} furthest={furthest} onSelect={setStep} />
      <Card className="mt-6 p-5 sm:p-8">
        {step === 'PERSONAL_DETAILS' && (
          <PersonalDetailsStep
            profile={state.profile}
            rules={state.config.eligibility}
            onSaved={(profile) => {
              setState({ ...state, profile });
              setStep(profile.salarySlip ? 'LOAN_CONFIG' : 'SALARY_SLIP');
            }}
            onRejected={() => updateProfile((profile) => ({ ...profile, bre: { ...profile.bre, eligible: false } }))}
          />
        )}
        {step === 'SALARY_SLIP' && (
          <SalarySlipStep
            slip={state.profile?.salarySlip ?? null}
            upload={state.config.upload}
            onUploaded={(salarySlip: SalarySlip) => updateProfile((profile) => ({ ...profile, salarySlip }))}
            onBack={() => setStep('PERSONAL_DETAILS')}
            onContinue={() => setStep('LOAN_CONFIG')}
          />
        )}
        {step === 'LOAN_CONFIG' && (
          <LoanConfigStep
            config={state.config.loan}
            onBack={() => setStep('SALARY_SLIP')}
            onApplied={setSubmittedLoan}
          />
        )}
      </Card>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">{children}</div>;
}
