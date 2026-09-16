import { NavLink, Outlet } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { Icon } from '../components/ui/Icon';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/orders', label: 'Orders', icon: 'orders' },
  { to: '/users', label: 'Users', icon: 'users' },
  { to: '/products', label: 'Products', icon: 'products' },
];

export function DashboardLayout() {
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUiStore();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  // Any in flight query, used for the thin progress bar. This is what makes a
  // background refetch visible without every page wiring up its own spinner.
  const fetching = useIsFetching();

  const initials = (session?.user.name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white
          transition-transform duration-200 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            D
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">Signed in as</p>
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
            {session?.user.email}
          </p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 h-full w-full cursor-default bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header
          className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b
            border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-6 dark:border-slate-800 dark:bg-slate-900/80"
        >
          <button
            type="button"
            className="btn-secondary px-2 py-1 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            <Icon name="menu" size={18} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary px-2 py-1"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>

            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">
                  {session?.user.name}
                </p>
                <p className="text-xs capitalize leading-tight text-slate-500 dark:text-slate-400">
                  {session?.user.role}
                </p>
              </div>
            </div>

            <button type="button" className="btn-secondary px-2 py-1" onClick={logout} aria-label="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>

        {fetching > 0 && (
          <div className="h-0.5 w-full overflow-hidden bg-brand-100 dark:bg-brand-950">
            <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-brand-600" />
          </div>
        )}

        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
