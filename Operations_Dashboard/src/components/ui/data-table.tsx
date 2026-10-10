import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';
import { Spinner } from './spinner';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const firstLoad = loading && rows === undefined;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {loading && rows !== undefined && (
        <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-brand-500" aria-hidden="true" />
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn('px-4 py-3 font-semibold', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows?.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('align-top', onRowClick && 'cursor-pointer hover:bg-slate-50')}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {firstLoad && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
          <Spinner className="size-5 text-brand-600" /> Loading…
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center" role="alert">
          <p className="text-sm text-rose-600">{error}</p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}
      {!loading && !error && rows?.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-medium text-slate-900">{emptyTitle}</p>
          {emptyDescription && <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>}
        </div>
      )}
    </div>
  );
}
