'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartState {
  addItem: (item: CartItem) => void;
  clear: () => void;
  itemCount: number;
  items: CartItem[];
  removeItem: (itemId: string) => void;
  setItems: (items: CartItem[]) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
}

function getItemCount(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (currentItem) => currentItem.variantId === item.variantId,
          );
          const nextQuantity = Math.min(
            (existingItem?.quantity ?? 0) + item.quantity,
            item.availableStock,
          );
          const items = existingItem
            ? state.items.map((currentItem) =>
                currentItem.variantId === item.variantId
                  ? toGuestCartItem({
                      ...currentItem,
                      availableStock: item.availableStock,
                      lineTotalMinor: item.lineTotalMinor,
                      quantity: nextQuantity,
                      stock: item.stock,
                      unitAmountMinor: item.unitAmountMinor,
                    })
                  : currentItem,
              )
            : [...state.items, toGuestCartItem(item)];

          return { itemCount: getItemCount(items), items };
        }),
      clear: () => set({ itemCount: 0, items: [] }),
      itemCount: 0,
      items: [],
      removeItem: (itemId) =>
        set((state) => {
          const items = state.items.filter((item) => item.id !== itemId);

          return { itemCount: getItemCount(items), items };
        }),
      setItems: (items) => set({ itemCount: getItemCount(items), items }),
      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((item) => item.id !== itemId)
              : state.items.map((item) =>
                  item.id === itemId ? toGuestCartItem({ ...item, quantity }) : item,
                );

          return { itemCount: getItemCount(items), items };
        }),
    }),
    {
      name: 'ep-guest-cart',
      partialize: (state) => ({ itemCount: state.itemCount, items: state.items }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

function toGuestCartItem(item: CartItem): CartItem {
  const lineTotalMinor =
    item.unitAmountMinor === null
      ? null
      : (BigInt(item.unitAmountMinor) * BigInt(item.quantity)).toString();

  return {
    ...item,
    lineTotalMinor,
  };
}
