/** Mirrors of the backend DTOs (backend/src/interfaces). */

export type Role = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';
export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
export type BreRule = 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';
export type ApplicationStep = 'PERSONAL_DETAILS' | 'SALARY_SLIP' | 'LOAN_CONFIG' | 'TRACK_LOAN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Actor {
  id: string;
  name: string;
  role: Role;
}

export interface BreFailure {
  rule: BreRule;
  message: string;
}

export interface SalarySlip {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface BorrowerProfile {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  bre: { eligible: boolean; age: number; failures: BreFailure[]; evaluatedAt: string };
  salarySlip: SalarySlip | null;
  updatedAt: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  applicant: {
    fullName: string;
    email: string;
    pan: string;
    dateOfBirth: string;
    age: number;
    monthlySalary: number;
    employmentMode: EmploymentMode;
  };
  salarySlip: SalarySlip;
  principal: number;
  tenureDays: number;
  interestRatePa: number;
  simpleInterest: number;
  totalRepayment: number;
  amountPaid: number;
  outstanding: number;
  status: LoanStatus;
  rejectionReason: string | null;
  sanctionedAt: string | null;
  rejectedAt: string | null;
  disbursedAt: string | null;
  closedAt: string | null;
  statusHistory: Array<{ status: LoanStatus; at: string; by: Actor; note: string | null }>;
  createdAt: string;
}

export interface Payment {
  id: string;
  utr: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

export interface ApplicationConfig {
  loan: {
    minPrincipal: number;
    maxPrincipal: number;
    principalStep: number;
    minTenureDays: number;
    maxTenureDays: number;
    interestRatePa: number;
  };
  eligibility: { minAge: number; maxAge: number; minMonthlySalary: number; panPattern: string };
  upload: { maxSizeBytes: number; allowedMimeTypes: string[] };
}

export interface ApplicationState {
  profile: BorrowerProfile | null;
  activeLoan: Loan | null;
  nextStep: ApplicationStep;
  config: ApplicationConfig;
}

export interface PersonalDetailsPayload {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface FieldIssue {
  location: 'body' | 'query' | 'params';
  field: string;
  message: string;
}
