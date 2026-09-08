import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getCategories } from './api';
import type { CategoryListQuery } from './types';

export function categoriesQueryOptions(query?: CategoryListQuery) {
  return queryOptions({
    queryFn: () => getCategories(query),
    queryKey: queryKeys.categories.list(query),
  });
}
