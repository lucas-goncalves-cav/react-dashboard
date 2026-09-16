import type { Metric } from '../types';

/**
 * Formatting helpers live outside component files.
 *
 * A module that exports both components and plain functions breaks React Fast
 * Refresh, which then does a full reload on every edit instead of preserving
 * state.
 */
export function formatMetric(metric: Metric): string {
  switch (metric.format) {
    case 'currency':
      return formatCurrency(metric.value);
    case 'percent':
      return `${metric.value.toFixed(1)}%`;
    default:
      return Math.round(metric.value).toLocaleString('en-US');
  }
}

export function formatCurrency(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US');
}
