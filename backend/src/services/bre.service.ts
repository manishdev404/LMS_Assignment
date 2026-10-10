import {
  ANY_PAN_REGEX,
  BRE_THRESHOLDS,
  EMPLOYMENT_MODES,
  INDIVIDUAL_PAN_REGEX,
  INELIGIBLE_EMPLOYMENT_MODES,
  type EmploymentMode,
} from '../constants/bre';
import type { BreFailure, EligibilityDecision } from '../interfaces/borrower.interface';
import { calculateAge, todayInBusinessTimezone } from '../utils/date';
import { formatInr } from '../utils/money';

export interface EligibilityInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

function panFailureMessage(pan: string): string {
  if (ANY_PAN_REGEX.test(pan)) {
    return (
      `PAN ${pan} is not an individual PAN (4th character is '${pan.charAt(3)}'). ` +
      `Personal loans need an individual PAN, where the 4th character is 'P' — e.g. ABCPE1234F.`
    );
  }
  return 'PAN must be 10 characters: 5 letters, 4 digits and 1 letter (e.g. ABCPE1234F).';
}

/**
 * Business Rule Engine — a pure function so it is trivially unit-testable and can be re-run
 * whenever needed (on profile submit and again when the loan is applied).
 * Every rule is evaluated so the borrower sees all problems at once.
 */
export function evaluateEligibility(
  input: EligibilityInput,
  today: Date = todayInBusinessTimezone(),
): EligibilityDecision {
  const { MIN_AGE, MAX_AGE, MIN_MONTHLY_SALARY } = BRE_THRESHOLDS;
  const age = calculateAge(input.dateOfBirth, today);
  const pan = input.pan.trim().toUpperCase();
  const failures: BreFailure[] = [];

  if (age < MIN_AGE || age > MAX_AGE) {
    failures.push({
      rule: 'AGE',
      message: `Applicant age is ${age} years; it must be between ${MIN_AGE} and ${MAX_AGE}.`,
    });
  }

  if (input.monthlySalary < MIN_MONTHLY_SALARY) {
    failures.push({
      rule: 'SALARY',
      message: `Monthly salary of ${formatInr(input.monthlySalary)} is below the minimum of ${formatInr(MIN_MONTHLY_SALARY)}.`,
    });
  }

  if (!INDIVIDUAL_PAN_REGEX.test(pan)) {
    failures.push({ rule: 'PAN', message: panFailureMessage(pan) });
  }

  if (INELIGIBLE_EMPLOYMENT_MODES.includes(input.employmentMode)) {
    failures.push({
      rule: 'EMPLOYMENT',
      message:
        input.employmentMode === EMPLOYMENT_MODES.UNEMPLOYED
          ? 'Unemployed applicants are not eligible for a loan.'
          : 'This employment type is not eligible for a loan.',
    });
  }

  return { eligible: failures.length === 0, age, failures };
}
