import type { Order, OrderStatus, Product, User, UserRole } from '../types';

/**
 * A deterministic dataset so the dashboard can be explored, and screenshotted,
 * without a backend. Seeded rather than random so every reload shows the same
 * numbers and a chart does not change shape between renders.
 */
const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'Joao'];
const LAST_NAMES = ['Almeida', 'Barbosa', 'Costa', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Henriques'];
const ROLES: UserRole[] = ['admin', 'manager', 'viewer'];
const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
const CATEGORIES = ['Electronics', 'Books', 'Furniture', 'Apparel', 'Sports'];

const PRODUCT_NAMES = [
  'Wireless Mouse',
  'Mechanical Keyboard',
  'Noise Cancelling Headset',
  'Standing Desk',
  'Office Chair',
  'Monitor Arm',
  'USB Hub',
  'Laptop Stand',
  'Desk Lamp',
  'Webcam',
];

/** Reference date so the generated history does not shift with the clock. */
const REFERENCE_DATE = new Date('2026-03-01T12:00:00Z');

function daysAgo(days: number): string {
  const date = new Date(REFERENCE_DATE);
  date.setDate(date.getDate() - days);

  return date.toISOString();
}

export const users: User[] = Array.from({ length: 47 }, (_, index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[index % LAST_NAMES.length];

  return {
    id: `user-${index + 1}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${index + 1}@example.com`,
    role: ROLES[index % ROLES.length],
    active: index % 7 !== 0,
    createdAt: daysAgo((index * 11) % 400),
  };
});

export const products: Product[] = Array.from({ length: 63 }, (_, index) => {
  const name = PRODUCT_NAMES[index % PRODUCT_NAMES.length];

  return {
    id: `product-${index + 1}`,
    name: `${name} ${Math.floor(index / PRODUCT_NAMES.length) + 1}`,
    category: CATEGORIES[index % CATEGORIES.length],
    price: Number((49.9 + index * 13.37).toFixed(2)),
    stock: (index * 7) % 120,
    active: index % 9 !== 0,
  };
});

export const orders: Order[] = Array.from({ length: 214 }, (_, index) => ({
  id: `order-${index + 1}`,
  reference: `ORD-${String(10_000 + index)}`,
  customerName: users[index % users.length].name,
  status: STATUSES[index % STATUSES.length],
  total: Number((59.9 + ((index * 137) % 4200)).toFixed(2)),
  itemCount: (index % 5) + 1,
  createdAt: daysAgo(index % 365),
}));

/**
 * How much of a period's activity a metric represents, so switching the
 * period filter changes the numbers in a way that looks plausible.
 */
export const PERIOD_FACTOR: Record<string, number> = {
  '7d': 0.23,
  '30d': 1,
  '90d': 2.9,
  '12m': 11.6,
};
