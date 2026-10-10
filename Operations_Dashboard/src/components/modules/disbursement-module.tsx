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
import { formatCurrency, formatDate } from '@/lib/format';
import type { Loan, Paginated } from '@/types/api';
import { LoanActionDialog } from './loan-action-dialog';
import { ApplicantCell, LoanRefCell, RepaymentCell } from './loan-cells';

export function DisbursementModule() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Loan | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const { data, loading, error, reload } = useApiQuery<Paginated<Loan>>(
    `/disbursement/loans${toQueryString({ page, limit: 10, search: debouncedSearch })}`,
  );

  const columns: Column<Loan>[] = [
    { key: 'loan', header: 'Loan', render: (loan) => <LoanRefCell loan={loan} dateLabel="Applied" date={loan.createdAt} /> },
    { key: 'borrower', header: 'Borrower', render: (loan) => <ApplicantCell loan={loan} /> },
    {
      key: 'amount',
      header: 'Amount to release',
      render: (loan) => (
        <div>
          <p className="text-base font-bold tabular-nums text-slate-900">{formatCurrency(loan.principal)}</p>
          <p className="text-xs text-slate-500">{loan.tenureDays} days</p>
        </div>
      ),
    },
    { key: 'repayment', header: 'Repayment', render: (loan) => <RepaymentCell loan={loan} /> },
    {
      key: 'sanctioned',
      header: 'Sanctioned',
      render: (loan) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium text-slate-900">{formatDate(loan.sanctionedAt)}</p>
          <p>by {loan.sanctionedBy?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (loan) => (
        <Button size="sm" onClick={() => setSelected(loan)}>
          Mark disbursed
        </Button>
      ),
    },
  ];

  async function disburse(loan: Loan, note: string) {
    await apiRequest<{ loan: Loan }>(`/disbursement/loans/${loan.id}/disburse`, {
      method: 'POST',
      body: { note: note || undefined },
    });
    toast.success(`${formatCurrency(loan.principal)} released for ${loan.loanNumber} — now in collection.`);
    setSelected(null);
    reload();
  }

  return (
    <>
      <ModuleHeader module="disbursement" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search loan no., name, email or PAN"
        />
        <p className="text-sm text-slate-500">{data ? `${data.pagination.total} loan(s) ready to disburse` : ''}</p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(loan) => loan.id}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="Nothing to disburse"
        emptyDescription="Loans appear here once the sanction team approves them."
      />
      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {selected && (
        <LoanActionDialog
          loan={selected}
          title="Confirm disbursement"
          description="Confirm the funds have been transferred. The loan becomes active (DISBURSED)."
          confirmLabel={`Disburse ${formatCurrency(selected.principal)}`}
          note={{ label: 'Transfer reference / note', placeholder: 'e.g. NEFT ref N123456789' }}
          onConfirm={(note) => disburse(selected, note)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
