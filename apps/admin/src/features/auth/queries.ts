import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getMe } from './api';

export function currentUserQueryOptions(enabled = true) {
  return queryOptions({
    enabled,
    queryFn: getMe,
    queryKey: queryKeys.auth.me,
    retry: false,
    staleTime: 60_000,
  });
}
