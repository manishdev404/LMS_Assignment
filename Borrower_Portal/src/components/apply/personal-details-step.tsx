'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { ApiError, apiRequest, errorMessage } from '@/lib/api';
import { previewEligibility, type EligibilityValues } from '@/lib/eligibility';
import { EMPLOYMENT_LABELS } from '@/lib/format';
import type { ApplicationConfig, BorrowerProfile, BreFailure, EmploymentMode, PersonalDetailsPayload } from '@/types/api';
import { EligibilityChecklist } from './eligibility-checklist';

interface FormValues extends EligibilityValues {
  fullName: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

interface PersonalDetailsStepProps {
  profile: BorrowerProfile | null;
  rules: ApplicationConfig['eligibility'];
  onSaved: (profile: BorrowerProfile) => void;
  onRejected: () => void;
}

function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function requiredFieldErrors(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.fullName.trim().length < 2) errors.fullName = 'Enter your full name as on your PAN card';
  if (!values.pan.trim()) errors.pan = 'Enter your PAN';
  if (!values.dateOfBirth) errors.dateOfBirth = 'Enter your date of birth';
  if (values.monthlySalary.trim() === '' || Number.isNaN(Number(values.monthlySalary)))
    errors.monthlySalary = 'Enter your monthly salary';
  if (!values.employmentMode) errors.employmentMode = 'Choose your employment type';
  return errors;
}

export function PersonalDetailsStep({ profile, rules, onSaved, onRejected }: PersonalDetailsStepProps) {
  const [values, setValues] = useState<FormValues>(() => ({
    fullName: profile?.fullName ?? '',
    pan: profile?.pan ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    monthlySalary: profile ? String(profile.monthlySalary) : '',
    employmentMode: profile?.employmentMode ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [breFailures, setBreFailures] = useState<BreFailure[] | null>(
    profile && !profile.bre.eligible ? profile.bre.failures : null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [today] = useState(() => new Date());

  const checks = useMemo(() => previewEligibility(values, rules, today), [values, rules, today]);

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const clientErrors = requiredFieldErrors(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    const payload: PersonalDetailsPayload = {
      fullName: values.fullName.trim(),
      pan: values.pan.trim().toUpperCase(),
      dateOfBirth: values.dateOfBirth,
      monthlySalary: Number(values.monthlySalary),
      employmentMode: values.employmentMode as EmploymentMode,
    };

    setSubmitting(true);
    setBreFailures(null);
    try {
      const result = await apiRequest<{ profile: BorrowerProfile }>('/borrower/profile', {
        method: 'PUT',
        body: payload,
      });
      onSaved(result.profile);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'BRE_REJECTED') {
        const details = err.details as { failures?: BreFailure[] } | undefined;
        setBreFailures(details?.failures ?? []);
        onRejected();
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        setErrors(err.fieldErrors);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Personal details</h2>
        <p className="text-sm text-slate-600">We use these to check your eligibility instantly.</p>
      </div>

      {breFailures && (
        <Alert tone="error" title="You are not eligible for a loan right now">
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {breFailures.map((failure) => (
              <li key={failure.rule}>{failure.message}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">If something was entered incorrectly, correct it and submit again.</p>
        </Alert>
      )}
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="fullName" label="Full name (as on PAN)" error={errors.fullName}>
              <Input
                id="fullName"
                autoComplete="name"
                value={values.fullName}
                onChange={(event) => update('fullName', event.target.value)}
                invalid={!!errors.fullName}
              />
            </Field>
          </div>
          <Field id="pan" label="PAN" hint="10 characters, e.g. ABCPE1234F" error={errors.pan}>
            <Input
              id="pan"
              value={values.pan}
              maxLength={10}
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono uppercase tracking-wider"
              placeholder="ABCPE1234F"
              onChange={(event) => update('pan', event.target.value.toUpperCase())}
              invalid={!!errors.pan}
            />
          </Field>
          <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
            <Input
              id="dateOfBirth"
              type="date"
              max={toIsoDate(today)}
              value={values.dateOfBirth}
              onChange={(event) => update('dateOfBirth', event.target.value)}
              invalid={!!errors.dateOfBirth}
            />
          </Field>
          <Field id="monthlySalary" label="Monthly salary (₹)" hint="Net take-home per month" error={errors.monthlySalary}>
            <Input
              id="monthlySalary"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="50000"
              value={values.monthlySalary}
              onChange={(event) => update('monthlySalary', event.target.value)}
              invalid={!!errors.monthlySalary}
            />
          </Field>
          <Field id="employmentMode" label="Employment type" error={errors.employmentMode}>
            <Select
              id="employmentMode"
              value={values.employmentMode}
              onChange={(event) => update('employmentMode', event.target.value as EmploymentMode | '')}
              invalid={!!errors.employmentMode}
            >
              <option value="" disabled>
                Select…
              </option>
              {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <EligibilityChecklist checks={checks} />
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" loading={submitting}>
          Check eligibility &amp; continue
        </Button>
      </div>
    </form>
  );
}
