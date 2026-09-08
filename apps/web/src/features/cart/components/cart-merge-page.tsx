'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Database, HardDrive, Merge, Minus, Package, Plus } from 'lucide-react';
import { getSafeRedirectPath } from '@/features/auth/redirect';
import { mergeCart } from '@/features/cart/api';
import { useCartStore } from '@/features/cart/store/cart-store';
import type { Cart, CartItem } from '@/features/cart/types';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { Input } from '@/shared/ui/input';
import { Price } from '@/shared/ui/price';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { cartQueryOptions, guestCartQuoteQueryOptions } from '../queries';

interface MergeOverride {
  quantity?: number;
  selected?: boolean;
}

interface MergeCandidate {
  defaultQuantity: number;
  guestItem: CartItem | null;
  isDuplicate: boolean;
  item: CartItem;
  maxQuantity: number;
  quantity: number;
  selected: boolean;
  serverItem: CartItem | null;
  variantId: string;
}

export function CartMergePage() {
  const guestItems = useCartStore((state) => state.items);
  const clearGuestCart = useCartStore((state) => state.clear);
  const cartQuery = useQuery(cartQueryOptions());
  const quoteCurrency = cartQuery.data?.currency ?? getCartCurrency(guestItems, cartQuery.data);
  const guestCartQuoteQuery = useQuery(guestCartQuoteQueryOptions(guestItems, quoteCurrency));
  const quotedGuestItems =
    guestCartQuoteQuery.data?.items.map((item) => ({
      ...item,
      currency: guestCartQuoteQuery.data.currency,
    })) ?? guestItems;
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirectTo'), '/cart');
  const { showToast } = useToast();
  const hasShownToast = useRef(false);
  const [overrides, setOverrides] = useState<Record<string, MergeOverride>>({});
  const candidates = useMemo(
    () => buildMergeCandidates(quotedGuestItems, cartQuery.data?.items ?? []),
    [cartQuery.data?.items, quotedGuestItems],
  );
  const resolvedCandidates = candidates.map((candidate) => {
    const override = overrides[candidate.variantId];

    return {
      ...candidate,
      quantity: clampQuantity(
        override?.quantity ?? candidate.defaultQuantity,
        candidate.maxQuantity,
      ),
      selected: override?.selected ?? true,
    };
  });
  const resolvedSelectedCandidates = resolvedCandidates.filter((candidate) => candidate.selected);
  const resolvedSubtotalMinor = resolvedSelectedCandidates.reduce(
    (total, candidate) =>
      candidate.item.unitAmountMinor === null
        ? total
        : total + BigInt(candidate.item.unitAmountMinor) * BigInt(candidate.quantity),
    BigInt(0),
  );
  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!cartQuery.data) {
        throw new Error('Account cart is not loaded');
      }

      return applyCartMerge(resolvedCandidates);
    },
    onSuccess: async (cart) => {
      queryClient.setQueryData(queryKeys.cart.detail, cart);
      clearGuestCart();
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
      showToast({
        description: 'Your selected items are now in the account cart.',
        title: 'Cart merged',
        variant: 'success',
      });
      router.replace(redirectTo);
      router.refresh();
    },
    onError: (error) => {
      showToast({
        description: getApiErrorMessage(error, 'Please review the quantities and try again.'),
        title: 'Could not merge cart',
        variant: 'error',
      });
    },
  });

  useEffect(() => {
    if (
      hasShownToast.current ||
      cartQuery.isLoading ||
      !quotedGuestItems.length ||
      !cartQuery.data?.items.length
    ) {
      return;
    }

    hasShownToast.current = true;
    showToast({
      description: 'You have items in this browser and in your account cart.',
      title: 'Cart merge needed',
      variant: 'success',
    });
  }, [cartQuery.data?.items.length, cartQuery.isLoading, quotedGuestItems.length, showToast]);

  function updateCandidate(variantId: string, override: MergeOverride) {
    setOverrides((currentOverrides) => ({
      ...currentOverrides,
      [variantId]: {
        ...currentOverrides[variantId],
        ...override,
      },
    }));
  }

  if (cartQuery.isLoading || (guestItems.length > 0 && guestCartQuoteQuery.isLoading)) {
    return <CartMergeSkeleton />;
  }

  if (cartQuery.isError) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title="Account cart is unavailable"
          message={getApiErrorMessage(cartQuery.error, 'We could not load your account cart.')}
          onRetry={() => cartQuery.refetch()}
        />
      </main>
    );
  }

  if (!guestItems.length) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-4">
          <EmptyState
            icon={Merge}
            title="No guest cart to merge"
            description="There are no local cart items waiting to be merged."
          />
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/cart">Go to cart</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 px-0">
        <Link href="/cart">
          <ArrowLeft className="size-4" />
          Back to cart
        </Link>
      </Button>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-primary">Cart merge</p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Choose what to keep
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            We found products in this browser before login and products already saved in your
            account cart.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={redirectTo}>Decide later</Link>
          </Button>
          <Button disabled={mergeMutation.isPending} onClick={() => mergeMutation.mutate()}>
            <Merge className="size-4" />
            {mergeMutation.isPending ? 'Saving...' : 'Save merged cart'}
          </Button>
        </div>
      </div>

      {mergeMutation.isError ? (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(mergeMutation.error, 'Could not merge cart.')}
        </div>
      ) : null}

      {guestCartQuoteQuery.isError ? (
        <div className="mb-6 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-muted-foreground">
          We could not refresh the local cart from current product data. The merge will still be
          validated before it is saved.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <CartSnapshotPanel
          currency={quoteCurrency}
          icon={HardDrive}
          items={quotedGuestItems}
          title="Local cart before login"
        />
        <CartSnapshotPanel
          currency={cartQuery.data?.currency ?? getCartCurrency(guestItems, cartQuery.data)}
          icon={Database}
          items={cartQuery.data?.items ?? []}
          title="Account cart"
        />
        <section className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <Merge className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Final cart after merge</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Selected items will remain in your account cart.
            </p>
          </div>

          <div className="divide-y">
            {resolvedCandidates.map((candidate) => (
              <MergeCandidateRow
                key={candidate.variantId}
                candidate={candidate}
                currency={quoteCurrency}
                disabled={mergeMutation.isPending}
                onQuantityChange={(quantity) => updateCandidate(candidate.variantId, { quantity })}
                onSelectedChange={(selected) => updateCandidate(candidate.variantId, { selected })}
              />
            ))}
          </div>

          <div className="border-t p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected items</span>
              <span className="font-medium text-foreground">
                {resolvedSelectedCandidates.reduce(
                  (total, candidate) => total + candidate.quantity,
                  0,
                )}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated subtotal</span>
              <span className="font-medium text-foreground">
                <Price
                  amountMinor={resolvedSubtotalMinor.toString()}
                  currency={quoteCurrency}
                  locale={quoteCurrency === 'VND' ? 'vi-VN' : 'en-US'}
                />
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface CartSnapshotPanelProps {
  currency: string;
  icon: LucideIcon;
  items: CartItem[];
  title: string;
}

function CartSnapshotPanel({ currency, icon: Icon, items, title }: CartSnapshotPanelProps) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {items.reduce((total, item) => total + item.quantity, 0)} item
          {items.length === 1 ? '' : 's'}
        </p>
      </div>
      {items.length ? (
        <div className="divide-y">
          {items.map((item) => (
            <CartSnapshotRow key={item.id} currency={currency} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-sm text-muted-foreground">No items in this cart.</div>
      )}
    </section>
  );
}

interface CartSnapshotRowProps {
  currency: string;
  item: CartItem;
}

function CartSnapshotRow({ currency, item }: CartSnapshotRowProps) {
  return (
    <article className="flex gap-3 p-4">
      <ProductThumb item={item} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{item.productName}</p>
        <p className="text-xs text-muted-foreground">SKU {item.sku}</p>
        {item.variantName ? (
          <p className="text-xs text-muted-foreground">{item.variantName}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">Qty {item.quantity}</Badge>
          <Price
            amountMinor={item.lineTotalMinor}
            currency={currency}
            locale={currency === 'VND' ? 'vi-VN' : 'en-US'}
            className="text-xs font-medium"
          />
        </div>
      </div>
    </article>
  );
}

interface MergeCandidateRowProps {
  candidate: MergeCandidate;
  currency: string;
  disabled: boolean;
  onQuantityChange: (quantity: number) => void;
  onSelectedChange: (selected: boolean) => void;
}

function MergeCandidateRow({
  candidate,
  currency,
  disabled,
  onQuantityChange,
  onSelectedChange,
}: MergeCandidateRowProps) {
  return (
    <article className="grid gap-3 p-4">
      <div className="flex gap-3">
        <Checkbox
          className="mt-1"
          checked={candidate.selected}
          disabled={disabled}
          onCheckedChange={(checked) => onSelectedChange(checked === true)}
        />
        <ProductThumb item={candidate.item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium text-foreground">
                {candidate.item.productName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">SKU {candidate.item.sku}</p>
            </div>
            {candidate.isDuplicate ? <Badge variant="warning">Duplicate</Badge> : null}
          </div>
          {candidate.item.variantName ? (
            <p className="mt-2 text-xs text-muted-foreground">{candidate.item.variantName}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pl-7">
        <QuantityStepper
          disabled={disabled || !candidate.selected}
          maxQuantity={candidate.maxQuantity}
          quantity={candidate.quantity}
          onChange={onQuantityChange}
        />
        <Price
          amountMinor={
            candidate.item.unitAmountMinor === null
              ? null
              : (BigInt(candidate.item.unitAmountMinor) * BigInt(candidate.quantity)).toString()
          }
          currency={currency}
          locale={currency === 'VND' ? 'vi-VN' : 'en-US'}
          className="text-sm font-semibold"
        />
      </div>
    </article>
  );
}

function ProductThumb({ item }: { item: CartItem }) {
  return (
    <div className="size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
      {item.imageUrl ? (
        // Product images come from backend-managed URLs that are not known at build time.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Package className="size-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

interface QuantityStepperProps {
  disabled: boolean;
  maxQuantity: number;
  onChange: (quantity: number) => void;
  quantity: number;
}

function QuantityStepper({ disabled, maxQuantity, onChange, quantity }: QuantityStepperProps) {
  return (
    <div className="flex w-fit items-center rounded-md border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-r-none"
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        key={quantity}
        aria-label="Quantity"
        className="h-8 w-14 rounded-none border-y-0 text-center shadow-none"
        disabled={disabled}
        inputMode="numeric"
        min={1}
        max={maxQuantity}
        type="number"
        defaultValue={quantity}
        onBlur={(event) => {
          const nextQuantity = Number(event.currentTarget.value);

          if (
            Number.isInteger(nextQuantity) &&
            nextQuantity >= 1 &&
            nextQuantity <= maxQuantity &&
            nextQuantity !== quantity
          ) {
            onChange(nextQuantity);
          }
        }}
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
        className="size-8 rounded-l-none"
        disabled={disabled || quantity >= maxQuantity}
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function CartMergeSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-10 w-32" />
      <div className="mb-8 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-96 w-full" />
        ))}
      </div>
    </main>
  );
}

function buildMergeCandidates(guestItems: CartItem[], serverItems: CartItem[]) {
  const variantIds = new Set([
    ...guestItems.map((item) => item.variantId),
    ...serverItems.map((item) => item.variantId),
  ]);

  return [...variantIds].map((variantId): MergeCandidate => {
    const guestItem = guestItems.find((item) => item.variantId === variantId) ?? null;
    const serverItem = serverItems.find((item) => item.variantId === variantId) ?? null;
    const item = serverItem ?? guestItem;

    if (!item) {
      throw new Error('Missing cart item while building merge candidates');
    }

    const defaultQuantity = clampQuantity(
      (serverItem?.quantity ?? 0) + (guestItem?.quantity ?? 0),
      Math.max(item.availableStock, serverItem?.quantity ?? 0, guestItem?.quantity ?? 0, 1),
    );

    return {
      defaultQuantity,
      guestItem,
      isDuplicate: Boolean(guestItem && serverItem),
      item,
      maxQuantity: Math.max(item.availableStock, defaultQuantity, 1),
      quantity: defaultQuantity,
      selected: true,
      serverItem,
      variantId,
    };
  });
}

function clampQuantity(quantity: number, maxQuantity: number) {
  return Math.max(1, Math.min(quantity, maxQuantity));
}

function applyCartMerge(candidates: MergeCandidate[]) {
  return mergeCart({
    items: candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => ({
        quantity: candidate.quantity,
        variantId: candidate.variantId,
      })),
  });
}

function getCartCurrency(guestItems: CartItem[], serverCart?: Cart) {
  return serverCart?.currency ?? guestItems[0]?.currency ?? 'VND';
}
