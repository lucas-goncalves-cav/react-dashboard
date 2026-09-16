import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

afterEach(() => {
  cleanup();
  localStorage.clear();

  // Zustand stores are module singletons, so state set by one test survives
  // into the next one. Clearing localStorage alone is not enough: the store
  // keeps its own copy in memory, and a test that signed in would make every
  // later test render a redirect instead of the login form.
  useAuthStore.setState({ session: null });
  useUiStore.setState({ theme: 'light', period: '30d', sidebarOpen: false });
  document.documentElement.classList.remove('dark');

  // A test that installs fake timers and then fails never reaches its own
  // cleanup, and every test after it inherits frozen time. Restoring here
  // stops one failure cascading into the whole file.
  vi.useRealTimers();
});

// jsdom does not implement matchMedia, which the UI store reads to pick the
// initial theme.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
