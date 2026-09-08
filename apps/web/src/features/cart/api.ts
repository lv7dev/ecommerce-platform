import { apiRequestWithSessionRefresh } from '@/features/auth/api';
import { apiRequest } from '@/shared/api/client';
import { apiEndpoints } from '@/shared/api/endpoints';
import type {
  AddCartItemInput,
  Cart,
  MergeCartInput,
  QuoteCartInput,
  UpdateCartItemInput,
} from './types';

export function getCart() {
  return apiRequestWithSessionRefresh<Cart>(apiEndpoints.cart.root);
}

export function quoteCart(input: QuoteCartInput) {
  return apiRequest<Cart>(apiEndpoints.cart.quote, {
    body: input,
    method: 'POST',
  });
}

export function addCartItem(input: AddCartItemInput) {
  return apiRequestWithSessionRefresh<Cart>(apiEndpoints.cart.items, {
    body: input,
    method: 'POST',
  });
}

export function updateCartItem(itemId: string, input: UpdateCartItemInput) {
  return apiRequestWithSessionRefresh<Cart>(apiEndpoints.cart.item(itemId), {
    body: input,
    method: 'PATCH',
  });
}

export function mergeCart(input: MergeCartInput) {
  return apiRequestWithSessionRefresh<Cart>(apiEndpoints.cart.merge, {
    body: input,
    method: 'POST',
  });
}

export function removeCartItem(itemId: string) {
  return apiRequestWithSessionRefresh<Cart>(apiEndpoints.cart.item(itemId), {
    method: 'DELETE',
  });
}

export function clearCart() {
  return apiRequestWithSessionRefresh<Cart>(apiEndpoints.cart.root, {
    method: 'DELETE',
  });
}
