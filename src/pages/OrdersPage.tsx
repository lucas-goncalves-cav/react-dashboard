import { useState } from 'react';
import { DataTable, Pagination, type Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { useOrders } from '../hooks/queries';
import { useTableState } from '../hooks/useTableState';
import { formatCurrency, formatDate } from '../utils/format';
import type { Order, OrderStatus } from '../types';

const STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const columns: Column<Order>[] = [
  { key: 'reference', header: 'Reference', sortable: true },
  { key: 'customerName', header: 'Customer' },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    align: 'center',
    render: (order) => <StatusBadge status={order.status} />,
  },
  { key: 'itemCount', header: 'Items', align: 'center' },
  {
    key: 'total',
    header: 'Total',
    sortable: true,
    align: 'right',
    render: (order) => formatCurrency(order.total, 2),
  },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    align: 'right',
    render: (order) => formatDate(order.createdAt),
  },
];

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const table = useTableState({ sortBy: 'createdAt', sortDescending: true });

  const request = { ...table.request, status: status || undefined };
  const { data, isPending, isFetching, error, refetch } = useOrders(request);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Orders</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every order, with its current fulfilment status.
        </p>
      </header>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row dark:border-slate-800">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={16} />
            </span>
            <input
              className="form-input pl-9"
              placeholder="Search by reference or customer"
              value={table.searchInput}
              onChange={(event) => table.setSearchInput(event.target.value)}
            />
          </div>

          <select
            className="form-input sm:w-44"
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus | '')}
          >
            <option value="">All statuses</option>
            {STATUSES.map((option) => (
              <option key={option} value={option} className="capitalize">
                {option}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          isLoading={isPending}
          isFetching={isFetching}
          error={error}
          onRetry={() => refetch()}
          sort={table.sort}
          onSortChange={table.setSort}
          emptyTitle="No orders found"
          emptyDescription="Try a different search term or clear the status filter."
        />

        {data && data.items.length > 0 && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalItems={data.totalItems}
            totalPages={data.totalPages}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        )}
      </div>
    </>
  );
}
