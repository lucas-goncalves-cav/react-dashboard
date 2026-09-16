# react-dashboard

An analytics dashboard in React and TypeScript, with the charts drawn by hand and every async state handled.

![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)
![Vite](https://img.shields.io/badge/Vite-8-646CFF)
![Tests](https://img.shields.io/badge/tests-28%20passing-success)
![License](https://img.shields.io/badge/license-MIT-green)

## Description

Most dashboard demos render a chart from a hardcoded array and stop there. The interesting parts of a real dashboard
are the ones around the chart: what the screen looks like while data loads, what happens when the request fails, what
a filter change does to the layout, and where each piece of state actually lives.

This one covers those. It ships with a mock API that is deliberately slow and can be made to fail, so the loading,
error and empty states are not theoretical.

## Objective

Show the decisions a React codebase actually turns on: separating server state from client state, keeping a filtered
table from flickering, and deciding when a charting library is worth its weight.

## Features

- **Dashboard** with five metrics, period filter and four charts
- **Charts built from scratch**: an SVG area chart with hover tooltips, a donut, and bar charts
- **Three table pages** with search, filters, sorting and pagination
- **Every async state**: skeletons on first load, dimming on refetch, error with retry, empty with guidance
- **Dark mode**, persisted, applied before first paint so there is no flash
- **Protected routes** that return you to where you were heading after signing in
- **Fault injection** so the error paths can be seen, not just read about
- 28 tests that render the real components against the real mock API

## The decisions worth explaining

### Server state and client state are not the same thing

The single most useful distinction in a React app, and the one that causes the most mess when ignored.

| | Owner | Tool here |
| --- | --- | --- |
| Metrics, orders, users, products | The server. Can go stale, needs caching and refetching. | **React Query** |
| Theme, selected period, sidebar open, session | This tab. Never stale, never refetched. | **Zustand** |

Putting server data in Zustand means reimplementing caching, deduplication and invalidation by hand. Putting the theme
in React Query means modelling a boolean as a network resource. Each tool does one job.

### Query keys live in one file

```typescript
export const queryKeys = {
  dashboard: (period: Period) => ['dashboard', period] as const,
  orders: (request: PageRequest & { status?: OrderStatus }) => ['orders', request] as const,
  // ...
};
```

Scattering string arrays through components is how invalidation quietly stops working: one place writes
`['orders', filters]`, another writes `['order', filters]`, and nothing ever refetches. Centralising them makes that
impossible.

### Why the layout does not collapse when a filter changes

```typescript
placeholderData: keepPreviousData,
```

Without it, every period click unmounts the charts, shows skeletons, and shifts the page. With it, the previous data
stays on screen and dims while the new request runs.

The distinction that makes this work is `isPending` versus `isFetching`:

| Flag | Means | UI |
| --- | --- | --- |
| `isPending` | First load, no data at all | Skeletons |
| `isFetching` | A request is in flight, data already exists | Dim the existing content |

A test pins the behaviour: clicking a period keeps the metric labels rendered rather than replacing them.

### Why the search is debounced

Each keystroke changes the query key, so without a debounce the cache fills with entries nobody will read again and
the network sees one request per character. 350ms in `useTableState` covers it.

The same hook resets the page to 1 when a filter changes. Staying on page 7 after narrowing to 3 results shows an
empty table for no obvious reason.

### Why there is no charting library

Recharts, Chart.js and friends are perfectly good. For this dashboard they were not worth it:

- The whole bundle is **380KB**, and a chart library is often a third of that on its own
- Theming is free, because every colour is a Tailwind class that already responds to dark mode
- The maths is about twenty lines, and showing it is more useful in a portfolio than showing an import

The line chart computes its own scale, gridlines, area path and hover targets:

```typescript
const step = data.length > 1 ? usableWidth / (data.length - 1) : 0;

const computed = data.map((point, index) => ({
  ...point,
  x: PADDING.left + step * index,
  y: PADDING.top + usableHeight - (point.value / max) * usableHeight,
}));
```

One detail worth copying: a 3px circle is not hoverable, so each point gets a wide invisible `<rect>` as its hit
target. Without it the tooltip is a game of precision mouse control.

The honest counterpoint: a library gives you legends, axes, animations, stacking and accessibility that this does not.
For anything past a handful of chart types, use one.

### Effects are for external systems, not for reacting to state

An earlier version reset the page inside an effect watching the filters. The linter objected, and it was right:

```typescript
// Before: an effect reacting to state, scheduling a second render every time
useEffect(() => { setPage(1); }, [search, pageSize]);

// After: the handler that caused the change does the reset
const setPageSize = (next: number) => {
  setPageSizeState(next);
  setPage(1);
};
```

The one effect left is the debounce timer, which is a genuine external system.

## Technologies

| Area | Stack |
| --- | --- |
| Framework | React 19, TypeScript, Vite |
| Server state | TanStack Query v5 |
| Client state | Zustand with `persist` |
| Routing | React Router v7 |
| Styling | Tailwind CSS, class based dark mode |
| Charts | Hand written SVG |
| Testing | Vitest, Testing Library |
| Infrastructure | Docker, nginx, GitHub Actions |

## Project structure

```
src/
  components/
    charts/      LineChart, BarChart, DonutChart, all plain SVG
    ui/          DataTable, Pagination, StatCard, Badge, Icon, States
  hooks/         queries.ts (React Query), useTableState.ts
  layouts/       DashboardLayout: sidebar, header, progress bar
  pages/         Dashboard, Orders, Users, Products, Login, NotFound
  services/      api.ts and mockData.ts, the only files that know about the backend
  stores/        authStore, uiStore
  utils/         Formatting helpers, kept out of component files
```

`services/` is the seam. Components never fetch; they call hooks, and hooks call services. Pointing the app at a real
API means editing `services/api.ts` and nothing else.

## How to run

```bash
git clone https://github.com/lucas-goncalves-cav/react-dashboard.git
cd react-dashboard

npm install
npm run dev
```

The app starts at `http://localhost:5173`.

### Demo accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@demo.com` | `admin123` | admin |
| `manager@demo.com` | `manager123` | manager |
| `viewer@demo.com` | `viewer123` | viewer |

Clicking one fills the form.

### Seeing the error states

The mock API has a fault injection switch. In the browser console:

```javascript
const api = await import('/src/services/api.ts');
api.faultInjection.failureRate = 1;   // every request fails
```

Reload a table page to see the error state and its retry button. Set it back to `0` and click retry to watch it
recover. The same switch drives two of the tests.

### With Docker

```bash
cp .env.example .env
docker compose up -d
```

Served by nginx at `http://localhost:5173`, with the SPA fallback configured so deep links like `/orders` work on a
hard refresh.

### Scripts

```bash
npm run dev        # development server
npm run build      # type check and production build
npm run lint       # oxlint
npm test           # vitest
npm run preview    # serve the production build locally
```

## Tests

28 tests that render real components against the real mock API, rather than stubbing the hooks:

| File | Covers |
| --- | --- |
| `DashboardPage.test.tsx` | Skeletons, metric formatting, chart labels, period switching, `keepPreviousData` |
| `OrdersPage.test.tsx` | Pagination, page size, status filter, debounced search, sorting, empty state, error and recovery |
| `LoginPage.test.tsx` | Sign in, wrong password, demo account fill, disabled while submitting, redirect when already signed in, expired session |

Two lessons from writing them are worth repeating, because both produced a cascade of confusing failures:

**Zustand stores are module singletons.** State set by one test survives into the next. Clearing `localStorage` is not
enough, because the store keeps its own copy in memory. A test that signed in made every later test render a redirect
instead of the login form. The fix is resetting the stores in `afterEach`.

**A failed test that installed fake timers never reaches its own cleanup**, so every test after it inherits frozen
time. `vi.useRealTimers()` in `afterEach` stops one failure taking the whole file with it.

## Connecting a real backend

Every function in `src/services/api.ts` returns a promise and nothing else. Replacing them with HTTP calls does not
touch a single component:

```typescript
export async function getOrders(request: PageRequest): Promise<PagedResult<Order>> {
  const { data } = await axios.get('/api/orders', { params: request });

  return data;
}
```

The hooks in `src/hooks/queries.ts` already handle caching, deduplication, retries and background refetching.

## Roadmap

- [ ] Mutations with optimistic updates, to show the rollback path
- [ ] CSV export and column visibility on tables
- [ ] Filters reflected in the URL, so a filtered view is shareable
- [ ] Virtualised rows for large datasets
- [ ] Storybook for the shared components

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
