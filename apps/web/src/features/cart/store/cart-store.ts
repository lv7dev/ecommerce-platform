'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartState {
  addItem: (item: CartItem) => void;
  clear: () => void;
  itemCount: number;
  items: CartItem[];
  removeItem: (variantId: string) => void;
  setItems: (items: CartItem[]) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
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
          const items = existingItem
            ? state.items.map((currentItem) =>
                currentItem.variantId === item.variantId
                  ? { ...currentItem, quantity: currentItem.quantity + item.quantity }
                  : currentItem,
              )
            : [...state.items, item];

          return { itemCount: getItemCount(items), items };
        }),
      clear: () => set({ itemCount: 0, items: [] }),
      itemCount: 0,
      items: [],
      removeItem: (variantId) =>
        set((state) => {
          const items = state.items.filter((item) => item.variantId !== variantId);

          return { itemCount: getItemCount(items), items };
        }),
      setItems: (items) => set({ itemCount: getItemCount(items), items }),
      updateQuantity: (variantId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((item) => item.variantId !== variantId)
              : state.items.map((item) =>
                  item.variantId === variantId ? { ...item, quantity } : item,
                );

          return { itemCount: getItemCount(items), items };
        }),
    }),
    {
      name: 'ep-cart',
      partialize: (state) => ({ itemCount: state.itemCount, items: state.items }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
