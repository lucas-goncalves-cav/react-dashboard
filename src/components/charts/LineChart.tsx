import { useId, useMemo, useState } from 'react';
import type { SeriesPoint } from '../../types';

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 32, left: 56 };

/**
 * An area chart drawn directly in SVG.
 *
 * Recharts and friends are perfectly good, and for a portfolio piece the point
 * is to show the maths rather than the import. It also keeps the bundle small
 * and makes the chart trivially themeable, since every colour is a Tailwind
 * class rather than a prop.
 */
export function LineChart({
  data,
  format = (value: number) => value.toLocaleString('en-US'),
  label = 'Line chart',
}: {
  data: SeriesPoint[];
  format?: (value: number) => string;
  label?: string;
}) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);

  const { points, ticks, linePath, areaPath } = useMemo(() => {
    const max = Math.max(...data.map((point) => point.value), 1);
    const usableWidth = WIDTH - PADDING.left - PADDING.right;
    const usableHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const step = data.length > 1 ? usableWidth / (data.length - 1) : 0;

    const computed = data.map((point, index) => ({
      ...point,
      x: PADDING.left + step * index,
      y: PADDING.top + usableHeight - (point.value / max) * usableHeight,
    }));

    const line = computed
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' ');

    const baseline = HEIGHT - PADDING.bottom;

    const area =
      computed.length === 0
        ? ''
        : `${line} L${computed.at(-1)!.x.toFixed(1)},${baseline} L${computed[0].x.toFixed(1)},${baseline} Z`;

    const gridlines = Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3;

      return {
        value: Math.round(max * (1 - ratio)),
        y: PADDING.top + usableHeight * ratio,
      };
    });

    return { points: computed, ticks: gridlines, linePath: line, areaPath: area };
  }, [data]);

  const active = hovered === null ? null : points[hovered];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-64 w-full"
        role="img"
        aria-label={label}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="text-brand-500" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" className="text-brand-500" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={tick.y}
              y2={tick.y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="fill-slate-400 text-[11px]"
            >
              {compact(tick.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          className="stroke-brand-600 dark:stroke-brand-400"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r={hovered === index ? 5 : 3}
              className="fill-brand-600 transition-all dark:fill-brand-400"
            />
            <text x={point.x} y={HEIGHT - 10} textAnchor="middle" className="fill-slate-400 text-[11px]">
              {point.label}
            </text>

            {/* A wide invisible target, because a 3px circle is not hoverable. */}
            <rect
              x={point.x - 18}
              y={PADDING.top}
              width={36}
              height={HEIGHT - PADDING.top - PADDING.bottom}
              fill="transparent"
              onMouseEnter={() => setHovered(index)}
            />
          </g>
        ))}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border
            border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            top: `${(active.y / HEIGHT) * 100}%`,
          }}
        >
          <p className="font-medium text-slate-500 dark:text-slate-400">{active.label}</p>
          <p className="font-semibold text-slate-900 dark:text-white">{format(active.value)}</p>
        </div>
      )}
    </div>
  );
}

function compact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  return value >= 1_000 ? `${Math.round(value / 1_000)}k` : String(value);
}
