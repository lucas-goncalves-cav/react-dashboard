import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/States';
import { useLogin } from '../hooks/queries';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const DEMO_ACCOUNTS = [
  { email: 'admin@demo.com', password: 'admin123' },
  { email: 'manager@demo.com', password: 'manager123' },
  { email: 'viewer@demo.com', password: 'viewer123' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const { theme, toggleTheme } = useUiStore();

  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');

  const login = useLogin();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const submit = (event: FormEvent) => {
    event.preventDefault();

    login.mutate(
      { email, password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              D
            </span>
            <span className="text-base font-semibold text-slate-900 dark:text-white">Dashboard</span>
          </div>

          <button type="button" className="btn-secondary px-2 py-1" onClick={toggleTheme} aria-label="Toggle theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Use one of the demo accounts below to explore the dashboard.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            {login.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {login.error instanceof Error ? login.error.message : 'Could not sign in.'}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={login.isPending}>
              {login.isPending && <Spinner className="h-4 w-4 border-white/40 border-t-white" />}
              Sign in
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <p className="mb-2 font-medium">Demo accounts</p>
            <ul className="space-y-1">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="underline decoration-dotted underline-offset-2 transition hover:text-brand-600"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                  >
                    {account.email} / {account.password}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
