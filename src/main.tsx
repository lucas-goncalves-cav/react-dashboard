import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A dashboard is read mostly and the data is not second by second
      // critical, so a short stale window avoids refetching on every mount
      // while still keeping figures fresh.
      staleTime: 30 * 1000,
      retry: 1,
      // Refetching on every window focus is the default and is usually wrong
      // for an internal dashboard: switching tabs should not cost a request.
      refetchOnWindowFocus: false,
    },
  },
});

// The stored theme is applied before React mounts, so there is no flash of the
// wrong palette on a hard refresh.
try {
  const stored = localStorage.getItem('react-dashboard.ui');

  if (stored && JSON.parse(stored)?.state?.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
} catch {
  // Storage can be unavailable in private browsing.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
