import type { ObjectId } from 'mongodb';
import type { BreRuleCode, EmploymentMode } from '../constants/bre';
import type { LoanDto } from './loan.interface';

export interface SalarySlipMeta {
  /** GridFS file id in the `salarySlips` bucket. */
  fileId: ObjectId;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface BreFailure {
  rule: BreRuleCode;
  message: string;
}

/** Output of the pure Business Rule Engine. */
export interface EligibilityDecision {
  eligible: boolean;
  age: number;
  failures: BreFailure[];
}

export interface BreRecord extends EligibilityDecision {
  evaluatedAt: Date;
}

export interface BorrowerProfileDocument {
  _id: ObjectId;
  userId: ObjectId;
  fullName: string;
  pan: string;
  /** UTC midnight of the calendar date of birth. */
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  bre: BreRecord;
  salarySlip: SalarySlipMeta | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalDetailsInput {
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface SalarySlipUpload {
  buffer: Buffer;
  originalName: string;
  declaredMimeType: string;
  size: number;
}

export interface SalarySlipDto {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface BorrowerProfileDto {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  bre: {
    eligible: boolean;
    age: number;
    failures: BreFailure[];
    evaluatedAt: string;
  };
  salarySlip: SalarySlipDto | null;
  updatedAt: string;
}

export type ApplicationStep = 'PERSONAL_DETAILS' | 'SALARY_SLIP' | 'LOAN_CONFIG' | 'TRACK_LOAN';

export interface ApplicationConfigDto {
  loan: {
    minPrincipal: number;
    maxPrincipal: number;
    principalStep: number;
    minTenureDays: number;
    maxTenureDays: number;
    interestRatePa: number;
  };
  eligibility: {
    minAge: number;
    maxAge: number;
    minMonthlySalary: number;
    panPattern: string;
  };
  upload: {
    maxSizeBytes: number;
    allowedMimeTypes: string[];
  };
}

export interface ApplicationStateDto {
  profile: BorrowerProfileDto | null;
  activeLoan: LoanDto | null;
  nextStep: ApplicationStep;
  config: ApplicationConfigDto;
}
