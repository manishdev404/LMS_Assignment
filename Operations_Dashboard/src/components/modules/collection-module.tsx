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
import { toQueryString } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Loan, Paginated, RecordPaymentResult } from '@/types/api';
import { ApplicantCell, LoanRefCell, RepaymentProgress } from './loan-cells';
import { PaymentDialog } from './payment-dialog';

type View = 'active' | 'closed';

const TABS: ReadonlyArray<{ id: View; label: string }> = [
  { id: 'active', label: 'Active (disbursed)' },
  { id: 'closed', label: 'Closed' },
];

export function CollectionModule() {
  const toast = useToast();
  const [view, setView] = useState<View>('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Loan | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const { data, loading, error, reload } = useApiQuery<Paginated<Loan>>(
    `/collection/loans${toQueryString({ view, page, limit: 10, search: debouncedSearch })}`,
  );

  const columns: Column<Loan>[] = [
    {
      key: 'loan',
      header: 'Loan',
      render: (loan) =>
        view === 'active' ? (
          <LoanRefCell loan={loan} dateLabel="Disbursed" date={loan.disbursedAt} />
        ) : (
          <LoanRefCell loan={loan} dateLabel="Closed" date={loan.closedAt} />
        ),
    },
    { key: 'borrower', header: 'Borrower', render: (loan) => <ApplicantCell loan={loan} showPan={false} /> },
    {
      key: 'total',
      header: 'Total repayment',
      render: (loan) => (
        <div>
          <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(loan.totalRepayment, true)}</p>
          <p className="text-xs text-slate-500">
            {formatCurrency(loan.principal)} + {formatCurrency(loan.simpleInterest, true)} interest
          </p>
        </div>
      ),
    },
    { key: 'progress', header: 'Repayment', render: (loan) => <RepaymentProgress loan={loan} /> },
    {
      key: 'due',
      header: 'Tenure',
      render: (loan) => (
        <div className="text-xs text-slate-600">
          <p className="font-medium text-slate-900">{loan.tenureDays} days</p>
          <p>since {formatDate(loan.disbursedAt)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (loan) => (
        <Button size="sm" variant={view === 'active' ? 'primary' : 'secondary'} onClick={() => setSelected(loan)}>
          {view === 'active' ? 'Record payment' : 'Payments'}
        </Button>
      ),
    },
  ];

  function handleRecorded(result: RecordPaymentResult) {
    toast.success(
      result.loanClosed
        ? `${result.loan.loanNumber} fully repaid and closed.`
        : `Payment of ${formatCurrency(result.payment.amount, true)} recorded. Outstanding ${formatCurrency(result.loan.outstanding, true)}.`,
    );
    setSelected(null);
    reload();
  }

  return (
    <>
      <ModuleHeader module="collection" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Loan view" className="inline-flex rounded-lg bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={view === tab.id}
              onClick={() => {
                setView(tab.id);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                view === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search loan no., name or email"
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(loan) => loan.id}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle={view === 'active' ? 'No active loans' : 'No closed loans yet'}
        emptyDescription={
          view === 'active'
            ? 'Disbursed loans appear here until they are fully repaid.'
            : 'Loans close automatically when the total repayment is received.'
        }
      />
      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {selected && (
        <PaymentDialog loan={selected} onClose={() => setSelected(null)} onRecorded={handleRecorded} />
      )}
    </>
  );
}
