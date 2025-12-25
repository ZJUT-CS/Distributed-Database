import { useList as useSharedList, type UseListOptions as UseSharedListOptions, type UseListReturn as UseSharedListReturn } from '@/shared/hooks';

export type UseAdminListOptions<T, F extends Record<string, unknown> = Record<string, unknown>> = UseSharedListOptions<T, F>;

export type UseAdminListReturn<T, F> = UseSharedListReturn<T, F>;

export function useAdminList<T, F extends Record<string, unknown> = Record<string, unknown>>(
  options: UseAdminListOptions<T, F>
): UseAdminListReturn<T, F> {
  return useSharedList(options);
}

export default useAdminList;
