import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseListOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  fetchFn: (params: { page: number; size: number } & F) => Promise<{ data: T[]; total: number }>;
  pageSize?: number;
  initialFilters?: F;
  autoFetch?: boolean;
}

export interface UseListReturn<T, F> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: F;
  setPage: (p: number) => void;
  setFilters: (f: Partial<F>) => void;
  resetFilters: () => void;
  refresh: (keepPage?: boolean) => void;
  retry: () => void;
}

export function useList<T, F extends Record<string, unknown> = Record<string, unknown>>(
  options: UseListOptions<T, F>
): UseListReturn<T, F> {
  const { fetchFn, pageSize = 10, initialFilters = {} as F, autoFetch = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<F>(initialFilters);

  const initialFiltersRef = useRef(initialFilters);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchData = useCallback(async (p: number, f: F, smartFallback = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFnRef.current({ page: p, size: pageSize, ...f });
      const data = res.data ?? [];
      const newTotal = res.total ?? 0;
      
      if (smartFallback && data.length === 0 && p > 1) {
        const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
        const fallbackPage = Math.min(p - 1, newTotalPages);
        setPageState(fallbackPage);
        return fetchData(fallbackPage, f, false);
      }
      
      setItems(data);
      setTotal(newTotal);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载失败';
      setError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const setPage = useCallback((p: number) => {
    setPageState(p);
    fetchData(p, filters);
  }, [fetchData, filters]);

  const setFilters = useCallback((partial: Partial<F>) => {
    const newFilters = { ...filters, ...partial };
    setFiltersState(newFilters);
    setPageState(1);
    fetchData(1, newFilters);
  }, [fetchData, filters]);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFiltersRef.current);
    setPageState(1);
    fetchData(1, initialFiltersRef.current);
  }, [fetchData]);

  const refresh = useCallback((keepPage = true) => {
    fetchData(page, filters, !keepPage);
  }, [fetchData, page, filters]);

  const retry = useCallback(() => {
    fetchData(page, filters);
  }, [fetchData, page, filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchData(1, filters);
    }
  }, []);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    filters,
    setPage,
    setFilters,
    resetFilters,
    refresh,
    retry,
  };
}

export default useList;
