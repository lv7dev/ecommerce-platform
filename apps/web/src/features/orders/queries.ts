import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getOrder, getOrders } from './api';

export function ordersQueryOptions(query: { limit?: number; page?: number } = {}) {
  return queryOptions({
    queryFn: () => getOrders(query),
    queryKey: queryKeys.orders.list(query),
    retry: false,
  });
}

export function orderQueryOptions(id: string) {
  return queryOptions({
    enabled: Boolean(id),
    queryFn: () => getOrder(id),
    queryKey: queryKeys.orders.detail(id),
    retry: false,
  });
}
