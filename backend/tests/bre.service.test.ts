import { describe, expect, it } from 'vitest';
import { EMPLOYMENT_MODES, type EmploymentMode } from '../src/constants/bre';
import { evaluateEligibility, type EligibilityInput } from '../src/services/bre.service';
import { parseIsoDate } from '../src/utils/date';

const TODAY = parseIsoDate('2026-10-10') as Date;

function input(overrides: Partial<Omit<EligibilityInput, 'dateOfBirth'>> & { dob?: string } = {}): EligibilityInput {
  return {
    dateOfBirth: parseIsoDate(overrides.dob ?? '1995-05-20') as Date,
    monthlySalary: overrides.monthlySalary ?? 50_000,
    pan: overrides.pan ?? 'ABCPE1234F',
    employmentMode: overrides.employmentMode ?? EMPLOYMENT_MODES.SALARIED,
  };
}

const failedRules = (result: ReturnType<typeof evaluateEligibility>) => result.failures.map((f) => f.rule);

describe('evaluateEligibility (BRE)', () => {
  it('passes a typical salaried applicant', () => {
    const result = evaluateEligibility(input(), TODAY);
    expect(result).toEqual({ eligible: true, age: 31, failures: [] });
  });

  describe('age rule (23–50 inclusive)', () => {
    it.each([
      ['2003-10-11', 22, false], // turns 23 tomorrow
      ['2003-10-10', 23, true], // 23rd birthday today
      ['1975-10-11', 50, true], // turns 51 tomorrow
      ['1975-10-10', 51, false], // 51st birthday today
    ])('dob %s → age %i, eligible=%s', (dob, age, eligible) => {
      const result = evaluateEligibility(input({ dob }), TODAY);
      expect(result.age).toBe(age);
      expect(failedRules(result).includes('AGE')).toBe(!eligible);
    });
  });

  describe('salary rule (≥ ₹25,000 / month)', () => {
    it.each([
      [24_999.99, false],
      [25_000, true],
    ])('salary %d → eligible=%s', (monthlySalary, eligible) => {
      expect(evaluateEligibility(input({ monthlySalary }), TODAY).eligible).toBe(eligible);
    });
  });

  describe('PAN rule (individual PAN)', () => {
    it.each([
      ['ABCPE1234F', true],
      ['abcpe1234f', true], // normalised to upper case
      ['ABCDE1234F', false], // 4th char D: not an individual
      ['ABCCE1234F', false], // company PAN
      ['ABCP1234F', false], // too short
      ['ABCPE12345', false], // last char must be a letter
      ['1BCPE1234F', false],
    ])('%s → eligible=%s', (pan, eligible) => {
      expect(evaluateEligibility(input({ pan }), TODAY).eligible).toBe(eligible);
    });

    it('explains why a non-individual PAN is rejected', () => {
      const [failure] = evaluateEligibility(input({ pan: 'ABCDE1234F' }), TODAY).failures;
      expect(failure?.message).toContain("4th character is 'D'");
    });
  });

  describe('employment rule', () => {
    it.each<[EmploymentMode, boolean]>([
      [EMPLOYMENT_MODES.SALARIED, true],
      [EMPLOYMENT_MODES.SELF_EMPLOYED, true],
      [EMPLOYMENT_MODES.UNEMPLOYED, false],
    ])('%s → eligible=%s', (employmentMode, eligible) => {
      expect(evaluateEligibility(input({ employmentMode }), TODAY).eligible).toBe(eligible);
    });
  });

  it('reports every failed rule at once', () => {
    const result = evaluateEligibility(
      input({ dob: '2008-01-01', monthlySalary: 10_000, pan: 'BAD', employmentMode: EMPLOYMENT_MODES.UNEMPLOYED }),
      TODAY,
    );
    expect(result.eligible).toBe(false);
    expect(failedRules(result)).toEqual(['AGE', 'SALARY', 'PAN', 'EMPLOYMENT']);
  });
});
