import type { EmploymentMode } from '../constants/bre';
import type { LeadStage } from '../constants/lead';
import type { LoanStatus } from '../constants/loan';
import type { Role } from '../constants/roles';
import type { BreFailure } from './borrower.interface';
import type { Paginated, PaginationQuery } from './common.interface';

export interface LeadDto {
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

export interface LeadsPageDto extends Paginated<LeadDto> {
  stageCounts: Record<LeadStage, number>;
}

export interface LeadsQuery extends PaginationQuery {
  stage?: LeadStage | undefined;
}

export interface LoanListQuery extends PaginationQuery {
  status?: LoanStatus | undefined;
}

export interface CollectionListQuery extends PaginationQuery {
  view: 'active' | 'closed';
}

export interface AdminOverviewDto {
  loansByStatus: Record<LoanStatus, number>;
  leads: number;
  totalDisbursed: number;
  totalCollected: number;
  outstanding: number;
  staffByRole: Partial<Record<Role, number>>;
}
