import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '../types';

interface AuthState {
  session: Session | null;
  setSession: (session: Session) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

/**
 * Client state: who is signed in.
 *
 * This is deliberately separate from React Query. Server state is data the
 * server owns and can go stale; the session is data this tab owns. Mixing the
 * two is the most common source of confusion in a React app.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,

      setSession: (session) => set({ session }),

      logout: () => set({ session: null }),

      isAuthenticated: () => {
        const { session } = get();

        return session !== null && session.expiresAt > Date.now();
      },
    }),
    {
      name: 'react-dashboard.auth',
      // Only the session is persisted. Actions would be serialized as
      // undefined and silently replace the real ones on rehydration.
      partialize: (state) => ({ session: state.session }),
    },
  ),
);
