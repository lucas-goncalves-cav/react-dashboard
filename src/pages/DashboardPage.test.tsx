import { describe, expect, it } from 'vitest';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { useUiStore } from '../stores/uiStore';

/**
 * These tests go through the real mock API rather than stubbing the hooks, so
 * they cover the loading, success and interaction path end to end.
 *
 * "Average ticket" is used as the readiness signal because it appears exactly
 * once. "Revenue" is both a metric label and a chart heading, so querying it
 * by text alone is ambiguous.
 */
describe('DashboardPage', () => {
  const loaded = () => screen.findByText('Average ticket');

  it('shows skeletons before the data arrives', () => {
    const { container } = renderWithProviders(<DashboardPage />);

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('renders every metric once loaded', async () => {
    renderWithProviders(<DashboardPage />);

    await loaded();

    for (const label of ['Customers', 'Orders', 'Average ticket', 'Conversion']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // Revenue is both a metric and a chart title, so both are expected.
    expect(screen.getAllByText('Revenue')).toHaveLength(2);
  });

  it('formats currency, counts and percentages differently', async () => {
    renderWithProviders(<DashboardPage />);

    await loaded();

    expect(screen.getAllByText(/^\$[\d,]+$/).length).toBeGreaterThan(0);
    expect(screen.getByText('4.8%')).toBeInTheDocument();
  });

  it('renders the charts with accessible labels', async () => {
    renderWithProviders(<DashboardPage />);

    await loaded();

    expect(screen.getByLabelText('Revenue over time')).toBeInTheDocument();
    expect(screen.getByLabelText('Conversion rate over time')).toBeInTheDocument();
    expect(screen.getByLabelText('Distribution')).toBeInTheDocument();
  });

  /**
   * The behaviour keepPreviousData buys: switching period does not throw the
   * layout back to skeletons.
   */
  it('keeps the previous data on screen while a new period loads', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await loaded();

    await user.click(screen.getByRole('button', { name: '7 days' }));

    // Still rendered mid fetch rather than replaced by placeholders.
    expect(screen.getByText('Average ticket')).toBeInTheDocument();

    await waitFor(() => {
      expect(useUiStore.getState().period).toBe('7d');
    });
  });

  it('changes the numbers when the period changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await loaded();

    const ordersCard = screen.getByText('Orders').closest('article');
    const before = ordersCard?.textContent;

    await user.click(screen.getByRole('button', { name: '12 months' }));

    await waitFor(() => {
      expect(screen.getByText('Orders').closest('article')?.textContent).not.toBe(before);
    });
  });

  it('shows the seven day series when that period is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await loaded();
    await user.click(screen.getByRole('button', { name: '7 days' }));

    // The same labels appear in the revenue chart, the conversion chart and
    // the new customers bars, so several matches is the expected result.
    expect((await screen.findAllByText('Mon')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sun').length).toBeGreaterThan(0);
  });

  it('marks the selected period as active', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />);

    await loaded();

    const ninetyDays = screen.getByRole('button', { name: '90 days' });
    await user.click(ninetyDays);

    await waitFor(() => {
      expect(ninetyDays.className).toContain('bg-brand-600');
    });
  });

  it('eventually removes every skeleton', async () => {
    const { container } = renderWithProviders(<DashboardPage />);

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).not.toBeNull();

    await waitForElementToBeRemoved(skeleton);

    expect(container.querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
