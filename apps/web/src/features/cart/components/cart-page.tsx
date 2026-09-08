'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Merge,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { RequestEmailVerificationButton } from '@/features/auth/components/request-email-verification-button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { clearCart, removeCartItem, updateCartItem } from '@/features/cart/api';
import { useCartStore } from '@/features/cart/store/cart-store';
import type { Cart, CartItem } from '@/features/cart/types';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { Input } from '@/shared/ui/input';
import { Price } from '@/shared/ui/price';
import { Skeleton } from '@/shared/ui/skeleton';
import { cartQueryOptions, guestCartQuoteQueryOptions } from '../queries';

export function CartPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data;
  const guestItems = useCartStore((state) => state.items);
  const clearGuestCart = useCartStore((state) => state.clear);
  const removeGuestItem = useCartStore((state) => state.removeItem);
  const setGuestItems = useCartStore((state) => state.setItems);
  const updateGuestQuantity = useCartStore((state) => state.updateQuantity);
  const cartQuery = useQuery(cartQueryOptions(Boolean(user)));
  const guestCartCurrency = getGuestCartCurrency(guestItems);
  const guestCartQuoteQuery = useQuery(
    guestCartQuoteQueryOptions(guestItems, guestCartCurrency, !user),
  );
  const updateItemMutation = useCartMutation();
  const removeItemMutation = useCartMutation();
  const clearCartMutation = useCartMutation();
  const [checkoutGate, setCheckoutGate] = useState<'email' | null>(null);
  const cart = user ? cartQuery.data : (guestCartQuoteQuery.data ?? getGuestCart(guestItems));
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const hasGuestCartToMerge = Boolean(user && guestItems.length > 0);
  const hasUnavailableItems = cart?.items.some((item) => !item.isAvailable) ?? false;
  const mutationError =
    updateItemMutation.error ?? removeItemMutation.error ?? clearCartMutation.error;

  function cacheCart(updatedCart: Cart) {
    queryClient.setQueryData(queryKeys.cart.detail, updatedCart);
  }

  function handleCheckout() {
    if (!user) {
      router.push('/login?redirectTo=%2Fcart');
      return;
    }

    if (guestItems.length > 0) {
      router.push('/cart/merge?redirectTo=%2Fcart');
      return;
    }

    if (!user.emailVerifiedAt) {
      setCheckoutGate('email');
      return;
    }

    router.push('/checkout');
  }

  useEffect(() => {
    if (user || !guestCartQuoteQuery.data) {
      return;
    }

    setGuestItems(
      guestCartQuoteQuery.data.items.map((item) => ({
        ...item,
        currency: guestCartQuoteQuery.data.currency,
      })),
    );
  }, [guestCartQuoteQuery.data, setGuestItems, user]);

  if (user && cartQuery.isLoading) {
    return <CartPageSkeleton />;
  }

  if (!user && guestItems.length > 0 && guestCartQuoteQuery.isLoading) {
    return <CartPageSkeleton />;
  }

  if (user && cartQuery.isError) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title="Cart is unavailable"
          message={getApiErrorMessage(cartQuery.error, 'We could not load your cart right now.')}
          onRetry={() => cartQuery.refetch()}
        />
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-4">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse the catalog and add an available product variant to start checkout."
          />
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Shopping cart</p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Review your items
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {itemCount} item{itemCount === 1 ? '' : 's'} in cart
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/products">Continue shopping</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={clearCartMutation.isPending}
            onClick={() =>
              user
                ? clearCartMutation.mutate(() => clearCart(), {
                    onSuccess: cacheCart,
                  })
                : clearGuestCart()
            }
          >
            <RotateCcw className="size-4" />
            Clear
          </Button>
        </div>
      </div>

      {hasGuestCartToMerge ? (
        <div className="mb-6 rounded-lg border border-warning/50 bg-warning/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Merge className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">Local cart waiting to merge</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You still have {guestItems.length} local cart item
                  {guestItems.length === 1 ? '' : 's'} from before signing in.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="sm:shrink-0">
              <Link href="/cart/merge?redirectTo=%2Fcart">
                <Merge className="size-4" />
                Review merge
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      {!user && guestCartQuoteQuery.isError ? (
        <div className="mb-6 rounded-lg border border-warning/50 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium text-foreground">Cart refresh failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We are showing the local cart snapshot. Prices and stock may have changed.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-lg border bg-card">
          {mutationError ? (
            <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {getApiErrorMessage(mutationError, 'Cart update failed. Please try again.')}
            </div>
          ) : null}

          <div className="hidden grid-cols-[minmax(0,1fr)_150px_140px_120px] gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-normal text-muted-foreground md:grid">
            <span>Product</span>
            <span>Quantity</span>
            <span>Line total</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y">
            {cart.items.map((item) => (
              <CartLineItem
                key={item.id}
                currency={cart.currency}
                item={item}
                isRemoving={removeItemMutation.isPending}
                isUpdating={updateItemMutation.isPending}
                onRemove={() =>
                  user
                    ? removeItemMutation.mutate(() => removeCartItem(item.id), {
                        onSuccess: cacheCart,
                      })
                    : removeGuestItem(item.id)
                }
                onUpdateQuantity={(quantity) =>
                  user
                    ? updateItemMutation.mutate(() => updateCartItem(item.id, { quantity }), {
                        onSuccess: cacheCart,
                      })
                    : updateGuestQuantity(item.id, quantity)
                }
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          {hasUnavailableItems ? (
            <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 text-warning" />
                <p className="text-muted-foreground">Some items need attention before checkout.</p>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Summary</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">
                  <Price
                    amountMinor={cart.subtotalMinor}
                    currency={cart.currency}
                    locale={cart.currency === 'VND' ? 'vi-VN' : 'en-US'}
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Items</dt>
                <dd className="font-medium text-foreground">{itemCount}</dd>
              </div>
            </dl>
            <Button
              className="mt-6 w-full"
              disabled={hasUnavailableItems || currentUserQuery.isLoading}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            {checkoutGate === 'email' ? (
              <div className="mt-4 rounded-md border border-warning/50 bg-warning/10 p-3">
                <p className="text-sm text-muted-foreground">
                  Please verify your email before checkout.
                </p>
                <RequestEmailVerificationButton className="mt-3 w-full" />
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}

function getGuestCart(items: CartItem[]): Cart {
  const currency = getGuestCartCurrency(items);
  const subtotalMinor = items.reduce(
    (total, item) => (item.lineTotalMinor === null ? total : total + BigInt(item.lineTotalMinor)),
    BigInt(0),
  );
  const now = new Date().toISOString();

  return {
    createdAt: now,
    currency,
    id: 'guest-cart',
    items,
    subtotalMinor: subtotalMinor.toString(),
    updatedAt: now,
    userId: 'guest',
  };
}

function getGuestCartCurrency(items: CartItem[]) {
  return items[0]?.currency ?? 'VND';
}

interface CartLineItemProps {
  currency: string;
  isRemoving: boolean;
  isUpdating: boolean;
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function CartLineItem({
  currency,
  isRemoving,
  isUpdating,
  item,
  onRemove,
  onUpdateQuantity,
}: CartLineItemProps) {
  const canDecrease = item.quantity > 1 && !isUpdating;
  const canIncrease = item.quantity < item.availableStock && !isUpdating && item.isAvailable;

  return (
    <article className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_150px_140px_120px] md:items-center">
      <div className="flex min-w-0 gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
          {item.imageUrl ? (
            // Product images come from backend-managed URLs that are not known at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-7 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <div>
            <h2 className="line-clamp-2 text-sm font-semibold text-foreground">
              {item.productName}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">SKU {item.sku}</p>
          </div>
          {item.variantName ? (
            <p className="text-xs text-muted-foreground">{item.variantName}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.isAvailable ? 'success' : 'warning'}>
              {item.isAvailable ? 'Available' : getUnavailableReasonLabel(item.unavailableReason)}
            </Badge>
            <span className="text-xs text-muted-foreground">{item.availableStock} available</span>
          </div>
          <p className="text-sm font-medium text-foreground md:hidden">
            <Price
              amountMinor={item.unitAmountMinor}
              currency={currency}
              locale={currency === 'VND' ? 'vi-VN' : 'en-US'}
            />
          </p>
        </div>
      </div>

      <QuantityControl
        disabled={isUpdating}
        quantity={item.quantity}
        maxQuantity={Math.max(item.availableStock, item.quantity)}
        canDecrease={canDecrease}
        canIncrease={canIncrease}
        onChange={onUpdateQuantity}
      />

      <div>
        <p className="text-xs text-muted-foreground md:hidden">Line total</p>
        <p className="text-sm font-semibold text-foreground">
          <Price
            amountMinor={item.lineTotalMinor}
            currency={currency}
            locale={currency === 'VND' ? 'vi-VN' : 'en-US'}
          />
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${item.productName}`}
          disabled={isRemoving}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </article>
  );
}

interface QuantityControlProps {
  canDecrease: boolean;
  canIncrease: boolean;
  disabled: boolean;
  maxQuantity: number;
  onChange: (quantity: number) => void;
  quantity: number;
}

function QuantityControl({
  canDecrease,
  canIncrease,
  disabled,
  maxQuantity,
  onChange,
  quantity,
}: QuantityControlProps) {
  return (
    <div className="flex w-fit items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-r-none"
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        key={quantity}
        aria-label="Quantity"
        className="h-9 w-14 rounded-none border-y-0 text-center shadow-none"
        disabled={disabled}
        inputMode="numeric"
        min={1}
        max={maxQuantity}
        type="number"
        defaultValue={quantity}
        onBlur={(event) =>
          commitQuantity(event.currentTarget.value, quantity, maxQuantity, onChange)
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-l-none"
        disabled={!canIncrease}
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function commitQuantity(
  value: string,
  currentQuantity: number,
  maxQuantity: number,
  onChange: (quantity: number) => void,
) {
  const nextQuantity = Number(value);

  if (
    Number.isInteger(nextQuantity) &&
    nextQuantity >= 1 &&
    nextQuantity <= maxQuantity &&
    nextQuantity !== currentQuantity
  ) {
    onChange(nextQuantity);
  }
}

function CartPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-44" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    </main>
  );
}

function useCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mutation: () => Promise<Cart>) => mutation(),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
    },
  });
}

function getUnavailableReasonLabel(reason: string | null) {
  switch (reason) {
    case 'PRODUCT_INACTIVE':
      return 'Product inactive';
    case 'VARIANT_INACTIVE':
      return 'Variant inactive';
    case 'INSUFFICIENT_STOCK':
      return 'Insufficient stock';
    case 'PRICE_UNAVAILABLE':
      return 'Price unavailable';
    default:
      return 'Unavailable';
  }
}
