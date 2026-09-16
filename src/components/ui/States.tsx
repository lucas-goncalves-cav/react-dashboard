import type { ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * The three states every async view needs, and the reason they are components
 * rather than inline JSX: a dashboard has a dozen places that load, and an
 * inconsistent empty state is more noticeable than a missing feature.
 */

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-full', 'w-9/12'];

  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={`h-4 ${widths[index % widths.length]}`} />
      ))}
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  description = 'There is no data to show for the selected filters.',
  icon = 'inbox',
  action,
}: {
  title?: string;
  description?: string;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message = error instanceof Error ? error.message : 'Something went wrong.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="rounded-full bg-red-50 p-4 text-red-500 dark:bg-red-950/50 dark:text-red-400">
        <Icon name="alert" size={28} />
      </span>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Could not load this</h3>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-1" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          Try again
        </button>
      )}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand-600
        dark:border-slate-700 dark:border-t-brand-400 ${className}`}
      aria-hidden="true"
    />
  );
}
