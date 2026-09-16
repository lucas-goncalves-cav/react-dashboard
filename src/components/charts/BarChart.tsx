import type { SeriesPoint } from '../../types';

/**
 * A horizontal bar chart built from divs rather than SVG.
 *
 * For ranked lists this reads better than a canvas: the labels are real text,
 * so they wrap, truncate and get read by a screen reader for free.
 */
export function BarChart({
  data,
  format = (value: number) => value.toLocaleString('en-US'),
}: {
  data: SeriesPoint[];
  format?: (value: number) => string;
}) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <ul className="space-y-3">
      {data.map((point) => (
        <li key={point.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-slate-600 dark:text-slate-300">{point.label}</span>
            <span className="shrink-0 font-medium text-slate-800 dark:text-slate-100">
              {format(point.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500 dark:bg-brand-500"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = ['#1c44f5', '#3167ff', '#588eff', '#8eb6ff', '#bcd3ff'];
const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface DonutSlice extends SeriesPoint {
  percentage: number;
  length: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

export function DonutChart({ data }: { data: SeriesPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;

  // Each slice starts where the previous one ended, so the offset is the
  // running sum of everything before it. Computing it with reduce keeps the
  // whole thing a pure derivation rather than a mutation during render.
  const slices = data.reduce<DonutSlice[]>((accumulated, point, index) => {
    const percentage = (point.value / total) * 100;
    const length = (percentage / 100) * CIRCUMFERENCE;
    const consumed = accumulated.reduce((sum, slice) => sum + slice.length, 0);

    accumulated.push({
      ...point,
      percentage,
      length,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
      dashArray: `${length} ${CIRCUMFERENCE - length}`,
      dashOffset: -consumed,
    });

    return accumulated;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90" role="img" aria-label="Distribution">
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-800"
            strokeWidth={18}
          />
          {slices.map((slice) => (
            <circle
              key={slice.label}
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={18}
              strokeDasharray={slice.dashArray}
              strokeDashoffset={slice.dashOffset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-slate-900 dark:text-white">
            {total.toLocaleString('en-US')}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">total</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {slice.percentage.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
