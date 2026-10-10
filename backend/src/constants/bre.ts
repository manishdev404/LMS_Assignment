export const EMPLOYMENT_MODES = {
  SALARIED: 'SALARIED',
  SELF_EMPLOYED: 'SELF_EMPLOYED',
  UNEMPLOYED: 'UNEMPLOYED',
} as const;

export type EmploymentMode = (typeof EMPLOYMENT_MODES)[keyof typeof EMPLOYMENT_MODES];

export const EMPLOYMENT_MODE_VALUES = Object.values(EMPLOYMENT_MODES) as [
  EmploymentMode,
  ...EmploymentMode[],
];

export const BRE_RULE_CODES = ['AGE', 'SALARY', 'PAN', 'EMPLOYMENT'] as const;
export type BreRuleCode = (typeof BRE_RULE_CODES)[number];

export const BRE_THRESHOLDS = {
  MIN_AGE: 23,
  MAX_AGE: 50,
  MIN_MONTHLY_SALARY: 25_000,
} as const;

export const INELIGIBLE_EMPLOYMENT_MODES: readonly EmploymentMode[] = [EMPLOYMENT_MODES.UNEMPLOYED];

/**
 * Individual PAN: AAA P A 9999 A
 *   - chars 1-3: alphabetic series
 *   - char 4   : holder type — 'P' = individual (C company, H HUF, F firm, T trust, ...)
 *   - char 5   : first letter of the surname
 *   - chars 6-9: sequence digits
 *   - char 10  : alphabetic check character
 * A personal loan can only be taken by an individual, so the 4th character must be 'P'.
 */
export const INDIVIDUAL_PAN_REGEX = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/;

/** Generic PAN structure — used only to give a more specific error message. */
export const ANY_PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** Ages and "today" are evaluated on the Indian calendar date. */
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';
