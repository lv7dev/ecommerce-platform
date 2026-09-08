import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getCart } from './api';

export function cartQueryOptions(enabled = true) {
  return queryOptions({
    enabled,
    queryFn: getCart,
    queryKey: queryKeys.cart.detail,
    retry: false,
  });
}
