import { DataTable, Pagination, type Column } from '../components/ui/DataTable';
import { ActiveBadge } from '../components/ui/Badge';
import { Icon } from '../components/ui/Icon';
import { useUsers } from '../hooks/queries';
import { useTableState } from '../hooks/useTableState';
import { formatDate } from '../utils/format';
import type { User } from '../types';

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    render: (user) => <span className="capitalize">{user.role}</span>,
  },
  {
    key: 'active',
    header: 'Status',
    align: 'center',
    render: (user) => <ActiveBadge active={user.active} />,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    align: 'right',
    render: (user) => formatDate(user.createdAt),
  },
];

export function UsersPage() {
  const table = useTableState({ sortBy: 'name', sortDescending: false });
  const { data, isPending, isFetching, error, refetch } = useUsers(table.request);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          People with access to the platform.
        </p>
      </header>

      <div className="card">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="relative max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={16} />
            </span>
            <input
              className="form-input pl-9"
              placeholder="Search by name or email"
              value={table.searchInput}
              onChange={(event) => table.setSearchInput(event.target.value)}
            />
          </div>
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
          emptyTitle="No users found"
          emptyDescription="Try a different search term."
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
