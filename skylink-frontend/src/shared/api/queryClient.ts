import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.code === 401 || error?.code === 403) {
          return false;
        }
        if (error?.code === 409) {
          return true;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.code === 401 || error?.code === 403) {
          return false;
        }
        if (error?.code === 409) {
          return true;
        }
        return failureCount < 1;
      },
    },
  },
});
