import * as React from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onOffsetChange: (offset: number) => void;
  className?: string;
}

/**
 * Simple offset-based pagination bar.
 * Renders Prev / Next buttons and a "Showing X–Y of Z" label.
 */
export function Pagination({ total, limit, offset, onOffsetChange, className }: PaginationProps) {
  const start = offset + 1;
  const end = Math.min(offset + limit, total);
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  if (total <= limit) return null;

  return (
    <div className={cn('flex items-center justify-between px-1 py-3 text-sm text-gray-500', className)}>
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={!hasPrev}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Previous
        </button>
        <button
          onClick={() => onOffsetChange(offset + limit)}
          disabled={!hasNext}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
