/** Mirrors of the backend DTOs (backend/src/interfaces). */

export type Role = 'ADMIN' | 'SALES' | 'SANCTION' | 'DISBURSEMENT' | 'COLLECTION' | 'BORROWER';
export type StaffRole = Exclude<Role, 'BORROWER'>;
export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';
export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
export type LeadStage = 'REGISTERED' | 'BRE_REJECTED' | 'DETAILS_SUBMITTED' | 'DOCUMENT_UPLOADED';

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
  rule: 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';
  message: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerId: string;
  applicant: {
    fullName: string;
    email: string;
    pan: string;
    dateOfBirth: string;
    age: number;
    monthlySalary: number;
    employmentMode: EmploymentMode;
  };
  salarySlip: { originalName: string; mimeType: string; size: number; uploadedAt: string };
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
  sanctionedBy: Actor | null;
  rejectedAt: string | null;
  rejectedBy: Actor | null;
  disbursedAt: string | null;
  disbursedBy: Actor | null;
  closedAt: string | null;
  statusHistory: Array<{ status: LoanStatus; at: string; by: Actor; note: string | null }>;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  loanId: string;
  utr: string;
  amount: number;
  paymentDate: string;
  recordedBy: Actor;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface Lead {
  userId: string;
  name: string;
  email: string;
  registeredAt: string;
  stage: LeadStage;
  profile: {
    fullName: string;
    pan: string;
    monthlySalary: number;
    employmentMode: EmploymentMode;
    age: number;
    eligible: boolean;
    breFailures: BreFailure[];
    salarySlipUploaded: boolean;
    updatedAt: string;
  } | null;
}

export interface LeadsPage extends Paginated<Lead> {
  stageCounts: Record<LeadStage, number>;
}

export interface LoanWithPayments {
  loan: Loan;
  payments: Payment[];
}

export interface RecordPaymentResult {
  payment: Payment;
  loan: Loan;
  loanClosed: boolean;
}

export interface AdminOverview {
  loansByStatus: Record<LoanStatus, number>;
  leads: number;
  totalDisbursed: number;
  totalCollected: number;
  outstanding: number;
  staffByRole: Partial<Record<StaffRole, number>>;
}

export interface FieldIssue {
  location: 'body' | 'query' | 'params';
  field: string;
  message: string;
}
