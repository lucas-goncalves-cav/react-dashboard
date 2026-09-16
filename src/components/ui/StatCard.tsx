import type { Metric } from '../../types';
import { formatMetric } from '../../utils/format';
import { Icon } from './Icon';
import { Skeleton } from './States';

const ICONS: Record<string, string> = {
  revenue: 'revenue',
  customers: 'users',
  orders: 'orders',
  ticket: 'ticket',
  conversion: 'conversion',
};

export function StatCard({ metric }: { metric: Metric }) {
  const positive = metric.change >= 0;

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{formatMetric(metric)}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <Icon name={ICONS[metric.key] ?? 'dashboard'} />
        </span>
      </div>

      <p
        className={`mt-3 flex items-center gap-1 text-xs font-medium ${
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        <Icon name={positive ? 'chevronUp' : 'chevronDown'} size={14} />
        {positive ? '+' : ''}
        {metric.change.toFixed(1)}% vs previous period
      </p>
    </article>
  );
}

export function StatCardSkeleton() {
  return (
    <article className="card space-y-3 p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </article>
  );
}
