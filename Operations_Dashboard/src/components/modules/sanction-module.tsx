'use client';

import { useState } from 'react';
import { ModuleHeader } from '@/components/layout/module-header';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { useToast } from '@/context/toast-context';
import { useApiQuery } from '@/hooks/use-api-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { apiRequest, toQueryString } from '@/lib/api';
import type { Loan, Paginated } from '@/types/api';
import { LoanActionDialog } from './loan-action-dialog';
import {
  ApplicantCell,
  ApplicantProfileCell,
  LoanRefCell,
  LoanTermsCell,
  RepaymentCell,
  SalarySlipLink,
} from './loan-cells';

type PendingAction = { kind: 'approve' | 'reject'; loan: Loan } | null;

export function SanctionModule() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<PendingAction>(null);
  const debouncedSearch = useDebouncedValue(search);

  const { data, loading, error, reload } = useApiQuery<Paginated<Loan>>(
    `/sanction/loans${toQueryString({ page, limit: 10, search: debouncedSearch })}`,
  );

  const columns: Column<Loan>[] = [
    { key: 'loan', header: 'Loan', render: (loan) => <LoanRefCell loan={loan} dateLabel="Applied" date={loan.createdAt} /> },
    { key: 'applicant', header: 'Applicant', render: (loan) => <ApplicantCell loan={loan} /> },
    { key: 'profile', header: 'Income', render: (loan) => <ApplicantProfileCell loan={loan} /> },
    { key: 'terms', header: 'Requested', render: (loan) => <LoanTermsCell loan={loan} /> },
    { key: 'repayment', header: 'Repayment', render: (loan) => <RepaymentCell loan={loan} /> },
    { key: 'slip', header: 'Salary slip', render: (loan) => <SalarySlipLink loan={loan} /> },
    {
      key: 'actions',
      header: 'Decision',
      className: 'text-right',
      render: (loan) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => setAction({ kind: 'reject', loan })}>
            Reject
          </Button>
          <Button size="sm" onClick={() => setAction({ kind: 'approve', loan })}>
            Approve
          </Button>
        </div>
      ),
    },
  ];

  async function decide(kind: 'approve' | 'reject', loan: Loan, note: string) {
    const body = kind === 'approve' ? { note: note || undefined } : { reason: note };
    await apiRequest<{ loan: Loan }>(`/sanction/loans/${loan.id}/${kind}`, { method: 'POST', body });
    toast.success(
      kind === 'approve'
        ? `${loan.loanNumber} sanctioned — sent to disbursement.`
        : `${loan.loanNumber} rejected.`,
    );
    setAction(null);
    reload();
  }

  return (
    <>
      <ModuleHeader module="sanction" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search loan no., name, email or PAN"
        />
        <p className="text-sm text-slate-500">
          {data ? `${data.pagination.total} application(s) awaiting a decision` : ''}
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(loan) => loan.id}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="No applications to review"
        emptyDescription="New loan applications appear here, oldest first."
      />
      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {action?.kind === 'approve' && (
        <LoanActionDialog
          loan={action.loan}
          title="Approve application"
          description="The loan moves to SANCTIONED and is queued for disbursement."
          confirmLabel="Approve loan"
          note={{ label: 'Note', placeholder: 'e.g. Salary slip verified' }}
          onConfirm={(note) => decide('approve', action.loan, note)}
          onClose={() => setAction(null)}
        />
      )}
      {action?.kind === 'reject' && (
        <LoanActionDialog
          loan={action.loan}
          title="Reject application"
          description="The loan moves to REJECTED. The borrower will see the reason."
          confirmLabel="Reject loan"
          tone="danger"
          note={{ label: 'Rejection reason', minLength: 5, placeholder: 'e.g. Salary slip does not match declared income' }}
          onConfirm={(reason) => decide('reject', action.loan, reason)}
          onClose={() => setAction(null)}
        />
      )}
    </>
  );
}
