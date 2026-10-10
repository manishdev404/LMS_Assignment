'use client';

import { useState } from 'react';
import { ModuleHeader } from '@/components/layout/module-header';
import { LEAD_STAGE_META, LeadStageBadge } from '@/components/ui/badges';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { StatCard } from '@/components/ui/stat-card';
import { useApiQuery } from '@/hooks/use-api-query';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toQueryString } from '@/lib/api';
import { EMPLOYMENT_LABELS, formatCurrency, formatDate } from '@/lib/format';
import type { Lead, LeadsPage, LeadStage } from '@/types/api';

const STAGES = Object.keys(LEAD_STAGE_META) as LeadStage[];

const COLUMNS: Column<Lead>[] = [
  {
    key: 'borrower',
    header: 'Borrower',
    render: (lead) => (
      <div>
        <p className="font-medium text-slate-900">{lead.profile?.fullName ?? lead.name}</p>
        <a href={`mailto:${lead.email}`} className="text-xs text-brand-700 hover:underline">
          {lead.email}
        </a>
      </div>
    ),
  },
  { key: 'registered', header: 'Registered', render: (lead) => formatDate(lead.registeredAt) },
  { key: 'stage', header: 'Stage', render: (lead) => <LeadStageBadge stage={lead.stage} /> },
  {
    key: 'profile',
    header: 'Profile',
    render: (lead) =>
      lead.profile ? (
        <div className="text-xs text-slate-600">
          <p>
            <span className="font-medium text-slate-900">{formatCurrency(lead.profile.monthlySalary)}</span> / month
          </p>
          <p>
            {EMPLOYMENT_LABELS[lead.profile.employmentMode]} · age {lead.profile.age}
          </p>
          <p className="font-mono">{lead.profile.pan}</p>
        </div>
      ) : (
        <span className="text-xs text-slate-400">Not submitted</span>
      ),
  },
  {
    key: 'followUp',
    header: 'Follow-up',
    className: 'max-w-sm',
    render: (lead) =>
      lead.stage === 'BRE_REJECTED' && lead.profile ? (
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-rose-700">
          {lead.profile.breFailures.map((failure) => (
            <li key={failure.rule}>{failure.message}</li>
          ))}
        </ul>
      ) : (
        <span className="text-xs text-slate-600">{LEAD_STAGE_META[lead.stage].hint}</span>
      ),
  },
];

export function SalesModule() {
  const [stage, setStage] = useState<LeadStage | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, loading, error, reload } = useApiQuery<LeadsPage>(
    `/sales/leads${toQueryString({ page, limit: 10, stage, search: debouncedSearch })}`,
  );
  const counts = data?.stageCounts;
  const totalLeads = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;

  const selectStage = (next: LeadStage | undefined) => {
    setStage(next);
    setPage(1);
  };

  return (
    <>
      <ModuleHeader module="sales" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="All leads" value={totalLeads ?? '—'} active={!stage} onClick={() => selectStage(undefined)} />
        {STAGES.map((item) => (
          <StatCard
            key={item}
            label={LEAD_STAGE_META[item].label}
            value={counts?.[item] ?? '—'}
            hint={LEAD_STAGE_META[item].hint}
            active={stage === item}
            onClick={() => selectStage(stage === item ? undefined : item)}
          />
        ))}
      </div>

      <div className="mt-6 mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, email or PAN"
        />
      </div>

      <DataTable
        columns={COLUMNS}
        rows={data?.items}
        rowKey={(lead) => lead.userId}
        loading={loading}
        error={error}
        onRetry={reload}
        emptyTitle="No leads found"
        emptyDescription="Borrowers who register but have not applied will appear here."
      />
      <Pagination pagination={data?.pagination} onPageChange={setPage} />
    </>
  );
}
