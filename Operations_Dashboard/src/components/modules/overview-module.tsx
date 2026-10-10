'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ModuleHeader } from '@/components/layout/module-header';
import { ModuleIcon } from '@/components/layout/module-icon';
import { LoanStatusBadge } from '@/components/ui/badges';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Spinner } from '@/components/ui/spinner';
import { StatCard } from '@/components/ui/stat-card';
import { useApiQuery } from '@/hooks/use-api-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toQueryString } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { MODULES } from '@/lib/rbac';
import type { AdminOverview, Loan, LoanStatus, LoanWithPayments, Paginated } from '@/types/api';
import { ApplicantCell, LoanTermsCell } from './loan-cells';
import { LoanDetail } from './loan-detail';

const STATUSES: LoanStatus[] = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED', 'REJECTED'];

const COLUMNS: Column<Loan>[] = [
  {
    key: 'loan',
    header: 'Loan',
    render: (loan) => (
      <div>
        <p className="font-mono text-sm font-semibold text-slate-900">{loan.loanNumber}</p>
        <p className="text-xs text-slate-500">{formatDate(loan.createdAt)}</p>
      </div>
    ),
  },
  { key: 'borrower', header: 'Borrower', render: (loan) => <ApplicantCell loan={loan} showPan={false} /> },
  { key: 'terms', header: 'Loan', render: (loan) => <LoanTermsCell loan={loan} /> },
  {
    key: 'balance',
    header: 'Paid / total',
    render: (loan) => (
      <span className="tabular-nums">
        {formatCurrency(loan.amountPaid, true)} / {formatCurrency(loan.totalRepayment, true)}
      </span>
    ),
  },
  { key: 'status', header: 'Status', render: (loan) => <LoanStatusBadge status={loan.status} /> },
];

export function OverviewModule() {
  const [status, setStatus] = useState<LoanStatus | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const overview = useApiQuery<AdminOverview>('/admin/overview');
  const loans = useApiQuery<Paginated<Loan>>(
    `/admin/loans${toQueryString({ status, page, limit: 10, search: debouncedSearch })}`,
  );
  const stats = overview.data;

  const selectStatus = (next: LoanStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <>
      <ModuleHeader module="overview" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total disbursed" value={stats ? formatCurrency(stats.totalDisbursed) : '—'} />
        <StatCard label="Total collected" value={stats ? formatCurrency(stats.totalCollected, true) : '—'} />
        <StatCard label="Outstanding" value={stats ? formatCurrency(stats.outstanding, true) : '—'} hint="Active loans" />
        <StatCard label="Open leads" value={stats?.leads ?? '—'} hint="Registered, not applied" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="All loans"
          value={stats ? Object.values(stats.loansByStatus).reduce((sum, count) => sum + count, 0) : '—'}
          active={!status}
          onClick={() => selectStatus(undefined)}
        />
        {STATUSES.map((item) => (
          <StatCard
            key={item}
            label={item.charAt(0) + item.slice(1).toLowerCase()}
            value={stats?.loansByStatus[item] ?? '—'}
            active={status === item}
            onClick={() => selectStatus(status === item ? undefined : item)}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.filter((module) => module.key !== 'overview').map((module) => (
          <Link
            key={module.key}
            href={module.path}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <ModuleIcon module={module.key} className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{module.label}</p>
              <p className="truncate text-xs text-slate-500">{module.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {status ? `${status.charAt(0) + status.slice(1).toLowerCase()} loans` : 'All loans'}
        </h2>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search loan no., name, email or PAN"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        rows={loans.data?.items}
        rowKey={(loan) => loan.id}
        loading={loans.loading}
        error={loans.error}
        onRetry={loans.reload}
        onRowClick={(loan) => setSelectedId(loan.id)}
        emptyTitle="No loans found"
      />
      <Pagination pagination={loans.data?.pagination} onPageChange={setPage} />

      {selectedId && <LoanDetailModal loanId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

function LoanDetailModal({ loanId, onClose }: { loanId: string; onClose: () => void }) {
  const { data, error } = useApiQuery<LoanWithPayments>(`/admin/loans/${loanId}`);
  return (
    <Modal open size="lg" title="Loan details" onClose={onClose}>
      {data ? (
        <LoanDetail loan={data.loan} payments={data.payments} />
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : (
        <p className="flex items-center gap-2 py-8 text-sm text-slate-500">
          <Spinner className="size-4" /> Loading…
        </p>
      )}
    </Modal>
  );
}
