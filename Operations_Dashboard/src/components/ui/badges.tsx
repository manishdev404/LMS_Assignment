import { cn } from '@/lib/cn';
import type { LeadStage, LoanStatus } from '@/types/api';

const BASE = 'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset';

const LOAN_STATUS_STYLES: Record<LoanStatus, string> = {
  APPLIED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  SANCTIONED: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  DISBURSED: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  CLOSED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return <span className={cn(BASE, LOAN_STATUS_STYLES[status])}>{status}</span>;
}

export const LEAD_STAGE_META: Record<LeadStage, { label: string; className: string; hint: string }> = {
  REGISTERED: {
    label: 'Registered',
    className: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    hint: 'Signed up, no details yet',
  },
  BRE_REJECTED: {
    label: 'BRE rejected',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    hint: 'Failed the eligibility check',
  },
  DETAILS_SUBMITTED: {
    label: 'Details submitted',
    className: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    hint: 'Eligible, salary slip missing',
  },
  DOCUMENT_UPLOADED: {
    label: 'Ready to apply',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    hint: 'Slip uploaded, not applied',
  },
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <span className={cn(BASE, LEAD_STAGE_META[stage].className)}>{LEAD_STAGE_META[stage].label}</span>;
}
