import { useState } from 'react';
import { DataTable, Pagination, type Column } from '../components/ui/DataTable';
import { ActiveBadge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { useProductCategories, useProducts } from '../hooks/queries';
import { useTableState } from '../hooks/useTableState';
import { formatCurrency } from '../utils/format';
import type { Product } from '../types';

const columns: Column<Product>[] = [
  { key: 'name', header: 'Product', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  {
    key: 'price',
    header: 'Price',
    sortable: true,
    align: 'right',
    render: (product) => formatCurrency(product.price, 2),
  },
  {
    key: 'stock',
    header: 'Stock',
    sortable: true,
    align: 'right',
    render: (product) => (
      <span className={product.stock === 0 ? 'font-medium text-red-600 dark:text-red-400' : undefined}>
        {product.stock}
      </span>
    ),
  },
  {
    key: 'active',
    header: 'Status',
    align: 'center',
    render: (product) => <ActiveBadge active={product.active} />,
  },
];

export function ProductsPage() {
  const [category, setCategory] = useState('');
  const table = useTableState({ sortBy: 'name', sortDescending: false });

  const { data: categories } = useProductCategories();
  const request = { ...table.request, category: category || undefined };
  const { data, isPending, isFetching, error, refetch } = useProducts(request);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Products</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Catalog and stock levels.</p>
      </header>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row dark:border-slate-800">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={16} />
            </span>
            <input
              className="form-input pl-9"
              placeholder="Search by name"
              value={table.searchInput}
              onChange={(event) => table.setSearchInput(event.target.value)}
            />
          </div>

          <select
            className="form-input sm:w-48"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {(categories ?? []).map((option) => (
              <option key={option} value={option}>
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
          emptyTitle="No products found"
          emptyDescription="Try a different search term or category."
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
