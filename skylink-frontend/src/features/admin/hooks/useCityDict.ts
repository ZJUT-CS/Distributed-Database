import { useQuery } from '@tanstack/react-query';
import { getCityDict } from '../api/dashboard';

export const useCityDict = (enabled = true) => {
  return useQuery({
    queryKey: ['cities', 'dict'],
    queryFn: () => getCityDict(),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
};
