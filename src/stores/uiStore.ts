import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Period } from '../types';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  period: Period;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setPeriod: (period: Period) => void;
  setSidebarOpen: (open: boolean) => void;
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      period: '30d',
      sidebarOpen: false,

      toggleTheme: () =>
        set((state) => {
          const theme = state.theme === 'dark' ? 'light' : 'dark';

          document.documentElement.classList.toggle('dark', theme === 'dark');

          return { theme };
        }),

      setPeriod: (period) => set({ period }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: 'react-dashboard.ui',
      partialize: (state) => ({ theme: state.theme, period: state.period }),
      // The class on <html> is what Tailwind reads, so it has to be applied
      // again after the store rehydrates from storage.
      onRehydrateStorage: () => (state) => {
        document.documentElement.classList.toggle('dark', state?.theme === 'dark');
      },
    },
  ),
);
