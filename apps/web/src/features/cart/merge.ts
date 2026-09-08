import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getCart, mergeCart } from './api';
import { useCartStore } from './store/cart-store';

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

  try {
    await mergeGuestCartToServer(queryClient);
  } catch {
    return {
      serverItemCount: 0,
      status: 'review',
    };
  }

  return { status: 'merged' };
}

export async function mergeGuestCartToServer(queryClient: QueryClient) {
  const guestItems = useCartStore.getState().items;

  if (!guestItems.length) {
    return;
  }

  const latestCart = await mergeCart({
    items: guestItems.map((item) => ({
      quantity: item.quantity,
      variantId: item.variantId,
    })),
  });

  useCartStore.getState().clear();
  queryClient.setQueryData(queryKeys.cart.detail, latestCart);

  await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
}
