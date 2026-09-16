export type Period = '7d' | '30d' | '90d' | '12m';

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Session {
  token: string;
  expiresAt: number;
  user: AuthenticatedUser;
}

export interface Metric {
  key: string;
  label: string;
  value: number;
  /** Percentage change against the previous period. */
  change: number;
  format: 'currency' | 'number' | 'percent';
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DashboardData {
  metrics: Metric[];
  revenue: SeriesPoint[];
  newCustomers: SeriesPoint[];
  ordersByStatus: SeriesPoint[];
  topProducts: SeriesPoint[];
  conversion: SeriesPoint[];
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  reference: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface PageRequest {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
