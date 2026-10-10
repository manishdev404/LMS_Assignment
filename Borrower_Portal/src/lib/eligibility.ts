import type { ApplicationConfig, BreRule, EmploymentMode } from '@/types/api';
import { formatCurrency } from './format';

/**
 * Client-side mirror of the server's Business Rule Engine, for instant feedback only.
 * The server re-runs the same rules and its decision is the one that counts.
 */
export type CheckStatus = 'pass' | 'fail' | 'pending';

export interface EligibilityCheck {
  rule: BreRule;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface EligibilityValues {
  pan: string;
  dateOfBirth: string;
  monthlySalary: string;
  employmentMode: EmploymentMode | '';
}

export function ageOn(dateOfBirth: string, today: Date): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) age -= 1;
  return age;
}

export function previewEligibility(
  values: EligibilityValues,
  rules: ApplicationConfig['eligibility'],
  today: Date,
): EligibilityCheck[] {
  const age = ageOn(values.dateOfBirth, today);
  const salary = values.monthlySalary.trim() === '' ? null : Number(values.monthlySalary);
  const pan = values.pan.trim().toUpperCase();
  const panRegex = new RegExp(rules.panPattern);

  return [
    {
      rule: 'AGE',
      label: `Age between ${rules.minAge} and ${rules.maxAge}`,
      status: age === null ? 'pending' : age >= rules.minAge && age <= rules.maxAge ? 'pass' : 'fail',
      detail: age === null ? 'Enter your date of birth' : `You are ${age} years old`,
    },
    {
      rule: 'SALARY',
      label: `Monthly salary of at least ${formatCurrency(rules.minMonthlySalary)}`,
      status:
        salary === null || Number.isNaN(salary) ? 'pending' : salary >= rules.minMonthlySalary ? 'pass' : 'fail',
      detail: salary === null || Number.isNaN(salary) ? 'Enter your monthly salary' : formatCurrency(salary),
    },
    {
      rule: 'PAN',
      label: 'Valid individual PAN',
      status: pan === '' ? 'pending' : panRegex.test(pan) ? 'pass' : 'fail',
      detail: pan === '' ? 'Format: ABCPE1234F (4th letter P)' : pan,
    },
    {
      rule: 'EMPLOYMENT',
      label: 'Salaried or self-employed',
      status: values.employmentMode === '' ? 'pending' : values.employmentMode === 'UNEMPLOYED' ? 'fail' : 'pass',
      detail: values.employmentMode === '' ? 'Choose your employment type' : '',
    },
  ];
}
