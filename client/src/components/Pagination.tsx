import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/format';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function buildPages(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages: Array<number | '…'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push('…');
  for (let current = start; current <= end; current += 1) pages.push(current);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);

  return pages;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-icon h-9 w-9 disabled:opacity-35"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {buildPages(page, totalPages).map((value, index) =>
        value === '…' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-zinc-600">
            …
          </span>
        ) : (
          <button
            key={value}
            type="button"
            onClick={() => onPageChange(value)}
            aria-current={value === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 rounded-xl px-2.5 text-sm font-semibold transition',
              value === page
                ? 'bg-brand-500 text-white shadow-glow'
                : 'border border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white'
            )}
          >
            {value}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-icon h-9 w-9 disabled:opacity-35"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
