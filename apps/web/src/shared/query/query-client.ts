import { QueryClient } from '@tanstack/react-query';
import { shouldRetryApiError } from '@/shared/api/errors';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        retry: 0,
      },
      queries: {
        gcTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => failureCount < 2 && shouldRetryApiError(error),
        staleTime: 1000 * 60,
      },
    },
  });
}
