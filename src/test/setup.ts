import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();

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
