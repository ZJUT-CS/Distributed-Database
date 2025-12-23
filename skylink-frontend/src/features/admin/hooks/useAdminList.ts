import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 通用管理列表 Hook
 * 统一处理 loading / error / empty / data 状态 + 分页 + 搜索筛选
 */
export interface UseAdminListOptions<T, F extends Record<string, unknown> = Record<string, unknown>> {
  /** 获取数据的异步函数 */
  fetchFn: (params: { page: number; size: number } & F) => Promise<{ data: T[]; total: number }>;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 初始筛选条件 */
  initialFilters?: F;
  /** 是否在挂载时自动加载 */
  autoFetch?: boolean;
}

export interface UseAdminListReturn<T, F> {
  /** 数据列表 */
  items: T[];
  /** 总条数 */
  total: number;
  /** 当前页码 (1-based) */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 筛选条件 */
  filters: F;
  /** 设置页码 */
  setPage: (p: number) => void;
  /** 更新筛选条件（自动重置到第一页） */
  setFilters: (f: Partial<F>) => void;
  /** 重置筛选条件 */
  resetFilters: () => void;
  /** 
   * 手动刷新
   * @param keepPage 为 true 时保持当前页，否则按智能逻辑：若当前页数据为空且不是第一页则回退
   */
  refresh: (keepPage?: boolean) => void;
  /** 重试（用于错误后重试） */
  retry: () => void;
}

export function useAdminList<T, F extends Record<string, unknown> = Record<string, unknown>>(
  options: UseAdminListOptions<T, F>
): UseAdminListReturn<T, F> {
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
      
      // 智能回退：当前页无数据且不是第一页时，回退到上一页
      if (smartFallback && data.length === 0 && p > 1) {
        const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
        const fallbackPage = Math.min(p - 1, newTotalPages);
        setPageState(fallbackPage);
        // 递归获取回退页数据
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
    // keepPage=true 保持当前页，keepPage=false 启用智能回退
    fetchData(page, filters, !keepPage);
  }, [fetchData, page, filters]);

  const retry = useCallback(() => {
    fetchData(page, filters);
  }, [fetchData, page, filters]);

  // 初始加载
  useEffect(() => {
    if (autoFetch) {
      fetchData(1, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default useAdminList;
