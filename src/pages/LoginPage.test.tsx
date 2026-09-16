import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { useAuthStore } from '../stores/authStore';

describe('LoginPage', () => {
  it('signs in with a demo account and stores the session', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(useAuthStore.getState().session).not.toBeNull();
    });

    expect(useAuthStore.getState().session?.user.email).toBe('admin@demo.com');
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('shows an error for the wrong password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const password = screen.getByLabelText('Password');
    await user.clear(password);
    await user.type(password, 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('fills the form when a demo account is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /viewer@demo.com/ }));

    expect(screen.getByLabelText('Email')).toHaveValue('viewer@demo.com');
    expect(screen.getByLabelText('Password')).toHaveValue('viewer123');
  });

  /**
   * The button is disabled while the request is in flight, which is what stops
   * a double submit. It does not re enable afterwards, because a successful
   * login replaces the form with a redirect.
   */
  it('disables the button while signing in', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();

    await waitFor(
      () => {
        expect(useAuthStore.getState().session).not.toBeNull();
      },
      { timeout: 5_000 },
    );
  });

  it('re enables the button after a failed attempt', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const password = screen.getByLabelText('Password');
    await user.clear(password);
    await user.type(password, 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await screen.findByText('Invalid email or password.');

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  /**
   * A signed in user opening /login should not see the form again.
   */
  it('redirects away when already signed in', async () => {
    useAuthStore.setState({
      session: {
        token: 'token',
        expiresAt: Date.now() + 60_000,
        user: { id: '1', name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
      },
    });

    renderWithProviders(<LoginPage />);

    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();

    useAuthStore.setState({ session: null });
  });

  it('treats an expired session as signed out', () => {
    useAuthStore.setState({
      session: {
        token: 'token',
        expiresAt: Date.now() - 1_000,
        user: { id: '1', name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
      },
    });

    expect(useAuthStore.getState().isAuthenticated()).toBe(false);

    useAuthStore.setState({ session: null });
  });
});
