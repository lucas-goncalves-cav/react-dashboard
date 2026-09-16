import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersPage } from './OrdersPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { faultInjection } from '../services/api';

describe('OrdersPage', () => {
  const table = () => screen.getByRole('table');

  async function renderLoaded() {
    const result = renderWithProviders(<OrdersPage />);
    await screen.findByRole('table');

    return result;
  }

  it('shows a skeleton and then the table', async () => {
    const { container } = renderWithProviders(<OrdersPage />);

    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('renders one page of orders with the configured page size', async () => {
    await renderLoaded();

    const rows = within(table()).getAllByRole('row');

    // Ten rows plus the header.
    expect(rows).toHaveLength(11);
    expect(screen.getByText(/Showing 1 to 10 of/)).toBeInTheDocument();
  });

  it('formats totals as currency and dates as dates', async () => {
    await renderLoaded();

    expect(within(table()).getAllByText(/^\$[\d,]+\.\d{2}$/).length).toBeGreaterThan(0);
    expect(within(table()).getAllByText(/^\d{1,2}\/\d{1,2}\/\d{4}$/).length).toBeGreaterThan(0);
  });

  it('moves to the next page', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const firstReference = within(table()).getAllByRole('row')[1].textContent;

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => {
      expect(screen.getByText(/Showing 11 to 20 of/)).toBeInTheDocument();
    });

    expect(within(table()).getAllByRole('row')[1].textContent).not.toBe(firstReference);
  });

  it('disables the previous button on the first page', async () => {
    await renderLoaded();

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('changes the page size', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.selectOptions(screen.getByLabelText('Rows'), '50');

    await waitFor(() => {
      expect(screen.getByText(/Showing 1 to 50 of/)).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const before = screen.getByText(/Showing 1 to \d+ of (\d+)/).textContent;

    await user.selectOptions(screen.getByRole('combobox', { name: '' }), 'cancelled');

    await waitFor(() => {
      expect(screen.getByText(/Showing 1 to \d+ of/).textContent).not.toBe(before);
    });

    // Every visible badge belongs to the selected status.
    const badges = within(table()).getAllByText('cancelled');
    expect(badges.length).toBeGreaterThan(0);
  });

  /**
   * The search is debounced by 350ms, so the assertion waits rather than
   * expecting an immediate refetch. Fake timers were tried here and fought
   * React Query's own scheduling; real waiting is both simpler and closer to
   * what a user experiences.
   */
  it('searches by reference after the debounce', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.type(screen.getByPlaceholderText(/Search by reference/), 'ORD-10001');

    await waitFor(
      () => {
        expect(screen.getByText(/Showing 1 to 1 of 1/)).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.type(screen.getByPlaceholderText(/Search by reference/), 'nothing-matches-this');

    await waitFor(
      () => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
      },
      { timeout: 5_000 },
    );

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  /**
   * Asserting the actual ordering rather than "the first row changed". The
   * cheapest order also happens to be the most recent, so a row comparison
   * would pass for the wrong reason.
   */
  it('sorts by total, ascending then descending', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    const totals = () =>
      within(table())
        .getAllByText(/^\$[\d,]+\.\d{2}$/)
        .map((cell) => Number(cell.textContent!.replace(/[$,]/g, '')));

    await user.click(screen.getByRole('button', { name: /Total/ }));

    await waitFor(() => {
      const values = totals();
      expect(values).toEqual([...values].sort((a, b) => a - b));
    });

    const ascending = totals();

    await user.click(screen.getByRole('button', { name: /Total/ }));

    await waitFor(() => {
      const values = totals();
      expect(values).toEqual([...values].sort((a, b) => b - a));
    });

    expect(totals()).not.toEqual(ascending);
  });

  /**
   * The error path, driven by the same fault injection switch the demo exposes.
   */
  it('shows an error state with a retry when the request fails', async () => {
    faultInjection.failureRate = 1;

    try {
      renderWithProviders(<OrdersPage />);

      expect(await screen.findByText('Could not load this')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
    } finally {
      faultInjection.failureRate = 0;
    }
  });

  it('recovers when the retry succeeds', async () => {
    const user = userEvent.setup();
    faultInjection.failureRate = 1;

    renderWithProviders(<OrdersPage />);
    await screen.findByText('Could not load this');

    faultInjection.failureRate = 0;
    await user.click(screen.getByRole('button', { name: /Try again/ }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
