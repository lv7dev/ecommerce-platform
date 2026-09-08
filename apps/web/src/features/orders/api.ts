import { apiRequestWithSessionRefresh } from '@/features/auth/api';
import { apiEndpoints } from '@/shared/api/endpoints';
import type { CancelOrderInput, CheckoutInput, Order, OrderList } from './types';

export function checkoutOrder(input: CheckoutInput, idempotencyKey: string) {
  return apiRequestWithSessionRefresh<Order>(apiEndpoints.checkout.root, {
    body: input,
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    method: 'POST',
  });
}

export function getOrders(query: { limit?: number; page?: number } = {}) {
  return apiRequestWithSessionRefresh<OrderList>(apiEndpoints.orders.list, {
    query,
  });
}

export function getOrder(id: string) {
  return apiRequestWithSessionRefresh<Order>(apiEndpoints.orders.detail(id));
}

export function cancelOrder(id: string, input: CancelOrderInput = {}) {
  return apiRequestWithSessionRefresh<Order>(apiEndpoints.orders.cancel(id), {
    body: input,
    method: 'POST',
  });
}
