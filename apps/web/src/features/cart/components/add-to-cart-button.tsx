'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Button, type ButtonProps } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useCartStore } from '@/features/cart/store/cart-store';
import { addCartItem } from '../api';
import type { CartItem } from '../types';

interface AddToCartButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  available?: boolean;
  availableLabel?: string;
  guestItem?: CartItem | null;
  quantity?: number;
  soldOutLabel?: string;
  variantId: string | null;
}

export function AddToCartButton({
  available = true,
  availableLabel = 'Add to cart',
  disabled,
  guestItem,
  quantity = 1,
  soldOutLabel = 'Sold out',
  variantId,
  ...props
}: AddToCartButtonProps) {
  const currentUserQuery = useCurrentUser();
  const queryClient = useQueryClient();
  const addGuestItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [hasGuestAdded, setHasGuestAdded] = useState(false);
  const addItemMutation = useMutation({
    mutationFn: () => {
      if (!variantId) {
        throw new Error('No product variant selected');
      }

      return addCartItem({ quantity, variantId });
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail, cart);
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
      showToast({
        description: 'Your cart has been updated.',
        title: 'Added to cart',
        variant: 'success',
      });
    },
    onError: (error) => {
      showToast({
        description: getApiErrorMessage(error, 'Please try again in a moment.'),
        title: 'Could not add product',
        variant: 'error',
      });
    },
  });

  const canAdd = Boolean(variantId) && available;
  const isBusy = addItemMutation.isPending || currentUserQuery.isLoading;
  const label = getButtonLabel({
    availableLabel,
    canAdd,
    isPending: addItemMutation.isPending,
    isSuccess: addItemMutation.isSuccess || hasGuestAdded,
    soldOutLabel,
  });

  return (
    <Button
      {...props}
      disabled={!canAdd || isBusy || disabled}
      onClick={() => {
        if (!currentUserQuery.data) {
          if (guestItem) {
            addGuestItem({ ...guestItem, quantity });
            setHasGuestAdded(true);
            showToast({
              description: 'You can checkout after signing in.',
              title: 'Added to cart',
              variant: 'success',
            });
          } else {
            showToast({
              description: 'This product variant is missing cart details.',
              title: 'Could not add product',
              variant: 'error',
            });
          }

          return;
        }

        addItemMutation.mutate();
      }}
    >
      <ShoppingCart className="size-4" />
      {label}
    </Button>
  );
}

function getButtonLabel(input: {
  availableLabel: string;
  canAdd: boolean;
  isPending: boolean;
  isSuccess: boolean;
  soldOutLabel: string;
}) {
  if (!input.canAdd) {
    return input.soldOutLabel;
  }

  if (input.isPending) {
    return 'Adding...';
  }

  if (input.isSuccess) {
    return 'Added';
  }

  return input.availableLabel;
}
