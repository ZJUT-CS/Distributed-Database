import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 下拉选项缓存 Hook
 * 用于航线、机型等需要从后端获取的下拉选项
 * 支持自动获取、手动刷新、SWR 式缓存
 */

export interface SelectOption<V = string | number> {
  value: V;
  label: string;
}

export interface UseAdminOptionsOptions<T, V = string | number> {
  /** 获取选项数据的异步函数 */
  fetchFn: () => Promise<T[]>;
  /** 将数据转换为选项格式 */
  transform: (item: T) => SelectOption<V>;
  /** 缓存时间（毫秒），默认 5 分钟 */
  cacheTime?: number;
  /** 是否在挂载时自动加载 */
  autoFetch?: boolean;
  /** 是否在每次组件挂载时检查缓存过期 */
  staleWhileRevalidate?: boolean;
}

export interface UseAdminOptionsReturn<V = string | number> {
  /** 选项列表 */
  options: SelectOption<V>[];
  /** 加载中 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 手动刷新（忽略缓存） */
  refresh: () => void;
  /** 获取选项（优先使用缓存） */
  fetch: () => void;
}

// 全局缓存存储
const optionsCache = new Map<string, { data: SelectOption[]; timestamp: number }>();

export function useAdminOptions<T, V = string | number>(
  cacheKey: string,
  options: UseAdminOptionsOptions<T, V>
): UseAdminOptionsReturn<V> {
  const {
    fetchFn,
    transform,
    cacheTime = 5 * 60 * 1000, // 默认 5 分钟
    autoFetch = true,
    staleWhileRevalidate = true,
  } = options;

  const [optionsList, setOptionsList] = useState<SelectOption<V>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFnRef = useRef(fetchFn);
  const transformRef = useRef(transform);
  fetchFnRef.current = fetchFn;
  transformRef.current = transform;

  const isCacheValid = useCallback(() => {
    const cached = optionsCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cacheTime;
  }, [cacheKey, cacheTime]);

  const getFromCache = useCallback(() => {
    const cached = optionsCache.get(cacheKey);
    return cached?.data as SelectOption<V>[] | undefined;
  }, [cacheKey]);

  const setToCache = useCallback((data: SelectOption<V>[]) => {
    optionsCache.set(cacheKey, {
      data: data as SelectOption[],
      timestamp: Date.now(),
    });
  }, [cacheKey]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // 如果缓存有效且不是强制刷新，使用缓存
    if (!forceRefresh && isCacheValid()) {
      const cached = getFromCache();
      if (cached) {
        setOptionsList(cached);
        return;
      }
    }

    // SWR：先展示缓存数据，后台更新
    if (staleWhileRevalidate && !forceRefresh) {
      const cached = getFromCache();
      if (cached) {
        setOptionsList(cached);
      }
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchFnRef.current();
      const transformed = data.map(transformRef.current);
      setOptionsList(transformed);
      setToCache(transformed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载选项失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isCacheValid, getFromCache, setToCache, staleWhileRevalidate]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const fetch = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  // 初始加载
  useEffect(() => {
    if (autoFetch) {
      fetchData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    options: optionsList,
    loading,
    error,
    refresh,
    fetch,
  };
}

/**
 * 清除指定缓存
 */
export function clearOptionsCache(cacheKey?: string) {
  if (cacheKey) {
    optionsCache.delete(cacheKey);
  } else {
    optionsCache.clear();
  }
}

export default useAdminOptions;
