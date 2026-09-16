import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { EmptyState, ErrorState, SkeletonList } from './States';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => ReactNode;
}

export interface SortState {
  sortBy: string;
  sortDescending: boolean;
}

/**
 * One table for every collection in the app.
 *
 * It owns the loading, error and empty states as well, because those are the
 * three things that get forgotten when each page builds its own table.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  isLoading,
  isFetching,
  error,
  onRetry,
  sort,
  onSortChange,
  emptyTitle,
  emptyDescription,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  /** A background refetch, as opposed to the first load. */
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonList rows={8} />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const alignClass = (align?: Column<T>['align']) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  const toggleSort = (key: string) => {
    if (!onSortChange) {
      return;
    }

    onSortChange({
      sortBy: key,
      sortDescending: sort?.sortBy === key ? !sort.sortDescending : false,
    });
  };

  return (
    <div className="overflow-x-auto">
      {/* A refetch dims the table instead of replacing it with skeletons, so
          changing a filter does not make the page jump. */}
      <table
        className={`w-full min-w-[640px] text-left text-sm transition-opacity ${
          isFetching ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <thead
          className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500
            dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400"
        >
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-4 py-3 font-medium ${alignClass(column.align)}`}>
                {column.sortable && onSortChange ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 transition hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => toggleSort(column.key)}
                  >
                    {column.header}
                    {sort?.sortBy === column.key && (
                      <Icon name={sort.sortDescending ? 'chevronDown' : 'chevronUp'} size={14} />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${alignClass(column.align)}`}
                >
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row
        sm:items-center sm:justify-between dark:border-slate-800"
    >
      <p className="text-slate-500 dark:text-slate-400">
        Showing {start} to {end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>Rows</span>
          <select
            className="form-input w-20 py-1"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn-secondary px-2 py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={16} />
        </button>

        <span className="text-slate-600 dark:text-slate-300">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          className="btn-secondary px-2 py-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}
