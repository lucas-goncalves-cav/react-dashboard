import type {
  DashboardData,
  Order,
  OrderStatus,
  PageRequest,
  PagedResult,
  Period,
  Product,
  Session,
  User,
} from '../types';
import { PERIOD_FACTOR, orders, products, users } from './mockData';

/**
 * A mock API that behaves like a real one: it is asynchronous, it is slow
 * enough that loading states are visible, and it can fail.
 *
 * Every function here returns a promise and nothing else. Swapping this file
 * for real HTTP calls does not change a single component, because components
 * only ever see the hooks in src/hooks.
 */

const LATENCY_MS = 450;

/**
 * Failure rate used to exercise error states. Set to 0 by default so the demo
 * is not annoying; raise it in the console to see the error UI.
 */
export const faultInjection = {
  failureRate: 0,
};

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (faultInjection.failureRate > 0 && Math.random() < faultInjection.failureRate) {
        reject(new Error('The server did not respond. Please try again.'));

        return;
      }

      resolve(value);
    }, ms);
  });
}

function paginate<T>(
  source: T[],
  request: PageRequest,
  sortValue: (item: T, key: string) => string | number,
): PagedResult<T> {
  const sorted = request.sortBy
    ? [...source].sort((left, right) => {
        const a = sortValue(left, request.sortBy!);
        const b = sortValue(right, request.sortBy!);

        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }

        return String(a).localeCompare(String(b));
      })
    : [...source];

  if (request.sortDescending) {
    sorted.reverse();
  }

  const pageSize = Math.max(1, request.pageSize);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, request.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    totalItems: sorted.length,
    page,
    pageSize,
    totalPages,
  };
}

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

const DEMO_ACCOUNTS = [
  { id: '1', name: 'Admin User', email: 'admin@demo.com', password: 'admin123', role: 'admin' as const },
  { id: '2', name: 'Manager User', email: 'manager@demo.com', password: 'manager123', role: 'manager' as const },
  { id: '3', name: 'Viewer User', email: 'viewer@demo.com', password: 'viewer123', role: 'viewer' as const },
];

export async function login(email: string, password: string): Promise<Session> {
  await delay(null, 600);

  const account = DEMO_ACCOUNTS.find(
    (candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password,
  );

  if (!account) {
    throw new Error('Invalid email or password.');
  }

  const { password: _password, ...user } = account;

  return {
    // A structurally valid JWT so the auth plumbing can be exercised without a
    // backend. The signature is a placeholder and must never be trusted.
    token: `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify(user))}.demo`,
    expiresAt: Date.now() + 60 * 60 * 1000,
    user,
  };
}

// -----------------------------------------------------------------------------
// Dashboard
// -----------------------------------------------------------------------------

function revenueSeries(period: Period, factor: number) {
  const labels =
    period === '12m'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : period === '90d'
        ? Array.from({ length: 12 }, (_, index) => `W${index + 1}`)
        : period === '30d'
          ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return labels.map((label, index) => ({
    label,
    value: Math.round((18_000 + Math.sin(index * 0.9) * 5_200 + index * 900) * (factor / labels.length) * 4),
  }));
}

export async function getDashboard(period: Period): Promise<DashboardData> {
  const factor = PERIOD_FACTOR[period];
  const revenue = 128_400 * factor;
  const orderCount = Math.round(842 * factor);
  const customers = Math.round(276 * factor);
  const series = revenueSeries(period, factor);

  return delay<DashboardData>({
    metrics: [
      { key: 'revenue', label: 'Revenue', value: revenue, change: 12.4, format: 'currency' },
      { key: 'customers', label: 'Customers', value: customers, change: 5.1, format: 'number' },
      { key: 'orders', label: 'Orders', value: orderCount, change: -2.3, format: 'number' },
      {
        key: 'ticket',
        label: 'Average ticket',
        value: revenue / Math.max(orderCount, 1),
        change: 3.7,
        format: 'currency',
      },
      { key: 'conversion', label: 'Conversion', value: 4.8, change: 0.6, format: 'percent' },
    ],
    revenue: series,
    newCustomers: series.map((point) => ({
      label: point.label,
      value: Math.round(point.value / 420),
    })),
    ordersByStatus: [
      { label: 'Delivered', value: Math.round(orderCount * 0.48) },
      { label: 'Shipped', value: Math.round(orderCount * 0.19) },
      { label: 'Paid', value: Math.round(orderCount * 0.17) },
      { label: 'Pending', value: Math.round(orderCount * 0.1) },
      { label: 'Cancelled', value: Math.round(orderCount * 0.06) },
    ],
    topProducts: products
      .slice(0, 6)
      .map((product, index) => ({ label: product.name, value: Math.round((260 - index * 34) * factor) })),
    conversion: series.map((point, index) => ({
      label: point.label,
      value: Number((3.8 + Math.sin(index * 0.7) * 1.2).toFixed(2)),
    })),
  });
}

// -----------------------------------------------------------------------------
// Collections
// -----------------------------------------------------------------------------

export async function getOrders(
  request: PageRequest & { status?: OrderStatus },
): Promise<PagedResult<Order>> {
  let filtered = orders;

  if (request.status) {
    filtered = filtered.filter((order) => order.status === request.status);
  }

  if (request.search) {
    const term = request.search.toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.reference.toLowerCase().includes(term) || order.customerName.toLowerCase().includes(term),
    );
  }

  return delay(
    paginate(filtered, request, (order, key) => {
      switch (key) {
        case 'total':
          return order.total;
        case 'status':
          return order.status;
        case 'createdAt':
          return order.createdAt;
        default:
          return order.reference;
      }
    }),
  );
}

export async function getUsers(request: PageRequest): Promise<PagedResult<User>> {
  const filtered = request.search
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(request.search!.toLowerCase()) ||
          user.email.toLowerCase().includes(request.search!.toLowerCase()),
      )
    : users;

  return delay(
    paginate(filtered, request, (user, key) => {
      switch (key) {
        case 'email':
          return user.email;
        case 'role':
          return user.role;
        case 'createdAt':
          return user.createdAt;
        default:
          return user.name;
      }
    }),
  );
}

export async function getProducts(
  request: PageRequest & { category?: string },
): Promise<PagedResult<Product>> {
  let filtered = products;

  if (request.category) {
    filtered = filtered.filter((product) => product.category === request.category);
  }

  if (request.search) {
    filtered = filtered.filter((product) =>
      product.name.toLowerCase().includes(request.search!.toLowerCase()),
    );
  }

  return delay(
    paginate(filtered, request, (product, key) => {
      switch (key) {
        case 'price':
          return product.price;
        case 'stock':
          return product.stock;
        case 'category':
          return product.category;
        default:
          return product.name;
      }
    }),
  );
}

export async function getProductCategories(): Promise<string[]> {
  return delay([...new Set(products.map((product) => product.category))].sort(), 120);
}
