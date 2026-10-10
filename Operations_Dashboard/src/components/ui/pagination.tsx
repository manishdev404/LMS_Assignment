import type { Pagination as PaginationData } from '@/types/api';
import { Button } from './button';

interface PaginationProps {
  pagination: PaginationData | undefined;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (!pagination || pagination.total === 0) return null;
  const { page, limit, total, totalPages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4 text-sm text-slate-600">
      <p>
        Showing <span className="font-medium text-slate-900">{from}</span>–
        <span className="font-medium text-slate-900">{to}</span> of{' '}
        <span className="font-medium text-slate-900">{total}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
