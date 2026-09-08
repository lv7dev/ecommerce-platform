import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { addCartItem, getCart } from './api';
import { useCartStore } from './store/cart-store';
import type { Cart, CartItem } from './types';

export type GuestCartAfterAuthResult =
  | {
      status: 'none';
    }
  | {
      status: 'merged';
    }
  | {
      serverItemCount: number;
      status: 'review';
    };

export async function prepareGuestCartAfterAuth(
  queryClient: QueryClient,
): Promise<GuestCartAfterAuthResult> {
  const guestItems = useCartStore.getState().items;

  if (!guestItems.length) {
    return { status: 'none' };
  }

  const serverCart = await getCart();
  queryClient.setQueryData(queryKeys.cart.detail, serverCart);

  if (serverCart.items.length > 0) {
    return {
      serverItemCount: serverCart.items.reduce((total, item) => total + item.quantity, 0),
      status: 'review',
    };
  }

  await mergeGuestCartToServer(queryClient);

  return { status: 'merged' };
}

export async function mergeGuestCartToServer(queryClient: QueryClient) {
  const guestItems = useCartStore.getState().items;

  if (!guestItems.length) {
    return;
  }

  const failedItems: CartItem[] = [];
  let latestCart: Cart | null = null;

  for (const item of guestItems) {
    try {
      latestCart = await addCartItem({
        quantity: item.quantity,
        variantId: item.variantId,
      });
    } catch {
      failedItems.push(item);
    }
  }

  useCartStore.getState().setItems(failedItems);

  if (latestCart) {
    queryClient.setQueryData(queryKeys.cart.detail, latestCart);
  }

  await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
}
