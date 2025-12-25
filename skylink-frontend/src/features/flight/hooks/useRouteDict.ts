import { useQuery } from '@tanstack/react-query';
import { getRouteDict } from '../api/routes';

export const useRouteDict = (enabled = true) => {
  return useQuery({
    queryKey: ['routes', 'dict'],
    queryFn: () => getRouteDict(),
    enabled,
    // 航线字典变化频率较低，长缓存即可；需要强制刷新可 invalidateQueries。
    staleTime: 24 * 60 * 60 * 1000,
  });
};
