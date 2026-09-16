import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { OrderStatus, PageRequest, Period } from '../types';

/**
 * Query keys in one place.
 *
 * Scattering string arrays through components is how invalidation quietly
 * stops working: one place writes ['orders', filters] and another writes
 * ['order', filters], and nothing ever refetches.
 */
export const queryKeys = {
  dashboard: (period: Period) => ['dashboard', period] as const,
  orders: (request: PageRequest & { status?: OrderStatus }) => ['orders', request] as const,
  users: (request: PageRequest) => ['users', request] as const,
  products: (request: PageRequest & { category?: string }) => ['products', request] as const,
  productCategories: () => ['products', 'categories'] as const,
};

export function useDashboard(period: Period) {
  return useQuery({
    queryKey: queryKeys.dashboard(period),
    queryFn: () => api.getDashboard(period),
    // Switching period keeps the previous chart on screen while the new data
    // loads, instead of collapsing the layout to skeletons on every click.
    placeholderData: keepPreviousData,
  });
}

export function useOrders(request: PageRequest & { status?: OrderStatus }) {
  return useQuery({
    queryKey: queryKeys.orders(request),
    queryFn: () => api.getOrders(request),
    placeholderData: keepPreviousData,
  });
}

export function useUsers(request: PageRequest) {
  return useQuery({
    queryKey: queryKeys.users(request),
    queryFn: () => api.getUsers(request),
    placeholderData: keepPreviousData,
  });
}

export function useProducts(request: PageRequest & { category?: string }) {
  return useQuery({
    queryKey: queryKeys.products(request),
    queryFn: () => api.getProducts(request),
    placeholderData: keepPreviousData,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: queryKeys.productCategories(),
    queryFn: api.getProductCategories,
    // The category list changes far less often than the products it filters.
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (session) => {
      setSession(session);

      // A different user must not see the previous one's cached data.
      queryClient.clear();
    },
  });
}
