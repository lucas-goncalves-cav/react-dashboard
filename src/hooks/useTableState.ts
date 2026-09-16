import { useEffect, useMemo, useState } from 'react';
import type { SortState } from '../components/ui/DataTable';

/**
 * Paging, sorting and a debounced search term, shared by every table page.
 *
 * The debounce matters: without it, each keystroke is a new query key, so the
 * cache fills with entries nobody will read again and the network sees one
 * request per character.
 */
export function useTableState(defaultSort?: SortState) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSortState] = useState<SortState | undefined>(defaultSort);

  // The one thing that genuinely belongs in an effect: a timer, which is an
  // external system. The debounced value is what feeds the query key.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      // Any filter change invalidates the current page. Staying on page 7
      // after narrowing to 3 results shows an empty table for no obvious
      // reason.
      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Resetting the page happens in the handler that caused it, not in an effect
  // reacting to the change. An effect would schedule a second render every
  // time a filter moved.
  const setPageSize = (next: number) => {
    setPageSizeState(next);
    setPage(1);
  };

  const setSort = (next: SortState) => {
    setSortState(next);
    setPage(1);
  };

  const request = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      sortBy: sort?.sortBy,
      sortDescending: sort?.sortDescending,
    }),
    [page, pageSize, search, sort],
  );

  return {
    request,
    page,
    pageSize,
    searchInput,
    sort,
    setPage,
    setPageSize,
    setSearchInput,
    setSort,
  };
}
