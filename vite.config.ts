/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The default forks pool fails to spawn workers on some Windows setups.
    // Threads start faster and the suite has no worker isolation needs.
    pool: 'threads',
  },
});
