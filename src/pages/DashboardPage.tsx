import { BarChart, DonutChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { StatCard, StatCardSkeleton } from '../components/ui/StatCard';
import { ErrorState, Skeleton } from '../components/ui/States';
import { useDashboard } from '../hooks/queries';
import { useUiStore } from '../stores/uiStore';
import { formatCurrency } from '../utils/format';
import type { Period } from '../types';

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
];

export function DashboardPage() {
  const period = useUiStore((state) => state.period);
  const setPeriod = useUiStore((state) => state.setPeriod);

  const { data, isPending, isFetching, error, refetch } = useDashboard(period);

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Business overview for the selected period.
          </p>
        </div>

        <div
          className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800"
          role="group"
          aria-label="Period"
        >
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                option.value === period
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {/* isPending is the first load. A period change is isFetching with the
          previous data still on screen, so the layout does not collapse. */}
      {isPending && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </section>
          <div className="card mt-4 p-5">
            <Skeleton className="h-64 w-full" />
          </div>
        </>
      )}

      {data && !error && (
        <div className={isFetching ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {data.metrics.map((metric) => (
              <StatCard key={metric.key} metric={metric} />
            ))}
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Revenue</h2>
              <LineChart data={data.revenue} format={(value) => formatCurrency(value)} label="Revenue over time" />
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Orders by status
              </h2>
              <DonutChart data={data.ordersByStatus} />
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                Conversion rate
              </h2>
              <LineChart
                data={data.conversion}
                format={(value) => `${value.toFixed(2)}%`}
                label="Conversion rate over time"
              />
            </div>

            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Top products</h2>
              <BarChart data={data.topProducts} />
            </div>
          </section>

          <section className="mt-4 card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">New customers</h2>
            <BarChart data={data.newCustomers} />
          </section>
        </div>
      )}
    </>
  );
}
