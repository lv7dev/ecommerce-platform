import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getCart, quoteCart } from './api';
import type { CartItem } from './types';

export function cartQueryOptions(enabled = true) {
  return queryOptions({
    enabled,
    queryFn: getCart,
    queryKey: queryKeys.cart.detail,
    retry: false,
  });
}

export function guestCartQuoteQueryOptions(items: CartItem[], currency = 'VND', enabled = true) {
  const quoteInput = {
    currency,
    items: items.map((item) => ({
      quantity: item.quantity,
      variantId: item.variantId,
    })),
  };

  return queryOptions({
    enabled: enabled && items.length > 0,
    queryFn: () => quoteCart(quoteInput),
    queryKey: queryKeys.cart.quote(quoteInput),
    retry: false,
  });
}
