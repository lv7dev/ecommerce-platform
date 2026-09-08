'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, MailWarning, MapPin, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { RequestEmailVerificationButton } from '@/features/auth/components/request-email-verification-button';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { cartQueryOptions } from '@/features/cart/queries';
import type { Cart } from '@/features/cart/types';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Price } from '@/shared/ui/price';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { checkoutOrder } from '../api';
import { checkoutSchema, type CheckoutFormValues } from '../schemas';

export function CheckoutPage() {
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data;

  if (currentUserQuery.isLoading) {
    return <CheckoutSkeleton />;
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-4">
          <EmptyState
            icon={ShoppingBag}
            title="Sign in to checkout"
            description="Your cart checkout is tied to your account so we can save the order history."
          />
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/login?redirectTo=%2Fcheckout">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!user.emailVerifiedAt) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MailWarning className="mt-0.5 size-5 text-warning" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground">Verify your email first</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Checkout is available after email verification so order notifications reach the
                right inbox.
              </p>
            </div>
          </div>
          <RequestEmailVerificationButton className="mt-5 w-full" />
        </div>
      </main>
    );
  }

  return <CheckoutContent defaultFullName={user.name ?? ''} />;
}

function CheckoutContent({ defaultFullName }: { defaultFullName: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const cartQuery = useQuery(cartQueryOptions(true));
  const checkoutAttemptRef = useRef<CheckoutAttempt>({
    cartSignature: null,
    idempotencyKey: createCheckoutIdempotencyKey(),
  });
  const cartSignature = cartQuery.data ? getCartSignature(cartQuery.data) : null;
  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      addressLine1: '',
      addressLine2: '',
      countryCode: 'VN',
      district: '',
      fullName: defaultFullName,
      note: '',
      phone: '',
      postalCode: '',
      province: '',
      ward: '',
    },
    resolver: zodResolver(checkoutSchema),
  });
  const checkoutMutation = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      checkoutOrder(
        buildCheckoutInput(values),
        getCheckoutAttemptKey(checkoutAttemptRef, cartSignature),
      ),
    onSuccess: (order) => {
      resetCheckoutAttempt(checkoutAttemptRef);
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail });
      void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      toast.showToast({
        description: `${order.orderNumber} has been created.`,
        title: 'Order placed',
      });
      router.replace(`/orders/${order.id}`);
    },
  });

  useEffect(() => {
    if (!cartSignature) {
      return;
    }

    resetCheckoutAttemptWhenCartChanges(checkoutAttemptRef, cartSignature);
  }, [cartSignature]);

  if (cartQuery.isLoading) {
    return <CheckoutSkeleton />;
  }

  if (cartQuery.isError) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title="Checkout is unavailable"
          message={getApiErrorMessage(cartQuery.error, 'We could not load your cart right now.')}
          onRetry={() => cartQuery.refetch()}
        />
      </main>
    );
  }

  const cart = cartQuery.data;

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-4">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add available product variants before starting checkout."
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

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Checkout</p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Shipping and review
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Confirm the delivery details before creating your order.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/cart">
            <ArrowLeft className="size-4" />
            Back to cart
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((values) => checkoutMutation.mutate(values))}
        >
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Shipping address</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="full-name"
                label="Full name"
                error={form.formState.errors.fullName?.message}
              >
                <Input id="full-name" autoComplete="name" {...form.register('fullName')} />
              </FormField>
              <FormField id="phone" label="Phone" error={form.formState.errors.phone?.message}>
                <Input id="phone" autoComplete="tel" inputMode="tel" {...form.register('phone')} />
              </FormField>
              <FormField
                className="sm:col-span-2"
                id="address-line-1"
                label="Address line 1"
                error={form.formState.errors.addressLine1?.message}
              >
                <Input
                  id="address-line-1"
                  autoComplete="address-line1"
                  {...form.register('addressLine1')}
                />
              </FormField>
              <FormField
                className="sm:col-span-2"
                id="address-line-2"
                label="Address line 2"
                error={form.formState.errors.addressLine2?.message}
              >
                <Input
                  id="address-line-2"
                  autoComplete="address-line2"
                  {...form.register('addressLine2')}
                />
              </FormField>
              <FormField id="ward" label="Ward" error={form.formState.errors.ward?.message}>
                <Input id="ward" {...form.register('ward')} />
              </FormField>
              <FormField
                id="district"
                label="District"
                error={form.formState.errors.district?.message}
              >
                <Input id="district" autoComplete="address-level2" {...form.register('district')} />
              </FormField>
              <FormField
                id="province"
                label="Province"
                error={form.formState.errors.province?.message}
              >
                <Input id="province" autoComplete="address-level1" {...form.register('province')} />
              </FormField>
              <FormField
                id="postal-code"
                label="Postal code"
                error={form.formState.errors.postalCode?.message}
              >
                <Input
                  id="postal-code"
                  autoComplete="postal-code"
                  {...form.register('postalCode')}
                />
              </FormField>
              <FormField
                id="country-code"
                label="Country code"
                error={form.formState.errors.countryCode?.message}
              >
                <Input
                  id="country-code"
                  autoComplete="country"
                  maxLength={2}
                  {...form.register('countryCode')}
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Order note</h2>
            </div>
            <FormField
              id="order-note"
              label="Note for the shop"
              error={form.formState.errors.note?.message}
            >
              <textarea
                id="order-note"
                className="flex min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Delivery time, invoice request, or anything the shop should know."
                {...form.register('note')}
              />
            </FormField>
          </section>

          {checkoutMutation.isError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(checkoutMutation.error, 'Unable to place order.')}
            </p>
          ) : null}

          <Button
            className="w-full sm:w-auto"
            disabled={checkoutMutation.isPending || hasUnavailableItems}
            type="submit"
          >
            {checkoutMutation.isPending ? 'Placing order...' : 'Place order'}
          </Button>
        </form>

        <CheckoutSummary cart={cart} />
      </div>
    </main>
  );
}

interface CheckoutAttempt {
  cartSignature: string | null;
  idempotencyKey: string;
}

function buildCheckoutInput(values: CheckoutFormValues) {
  return {
    note: emptyToUndefined(values.note),
    shippingAddress: {
      addressLine1: values.addressLine1,
      addressLine2: emptyToUndefined(values.addressLine2),
      countryCode: values.countryCode,
      district: values.district,
      fullName: values.fullName,
      phone: values.phone,
      postalCode: emptyToUndefined(values.postalCode),
      province: values.province,
      ward: emptyToUndefined(values.ward),
    },
  };
}

function createCheckoutIdempotencyKey() {
  return `checkout_${crypto.randomUUID()}`;
}

function getCheckoutAttemptKey(
  checkoutAttemptRef: React.MutableRefObject<CheckoutAttempt>,
  cartSignature: string | null,
) {
  if (cartSignature) {
    resetCheckoutAttemptWhenCartChanges(checkoutAttemptRef, cartSignature);
  }

  return checkoutAttemptRef.current.idempotencyKey;
}

function resetCheckoutAttempt(checkoutAttemptRef: React.MutableRefObject<CheckoutAttempt>) {
  checkoutAttemptRef.current = {
    cartSignature: null,
    idempotencyKey: createCheckoutIdempotencyKey(),
  };
}

function resetCheckoutAttemptWhenCartChanges(
  checkoutAttemptRef: React.MutableRefObject<CheckoutAttempt>,
  cartSignature: string,
) {
  if (checkoutAttemptRef.current.cartSignature === cartSignature) {
    return;
  }

  checkoutAttemptRef.current = {
    cartSignature,
    idempotencyKey: createCheckoutIdempotencyKey(),
  };
}

function getCartSignature(cart: Cart) {
  return JSON.stringify({
    currency: cart.currency,
    id: cart.id,
    items: cart.items
      .map((item) => ({
        availableStock: item.availableStock,
        id: item.id,
        isAvailable: item.isAvailable,
        lineTotalMinor: item.lineTotalMinor,
        quantity: item.quantity,
        unitAmountMinor: item.unitAmountMinor,
        variantId: item.variantId,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    subtotalMinor: cart.subtotalMinor,
  });
}

function emptyToUndefined(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function CheckoutSummary({ cart }: { cart: Cart }) {
  const itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <aside className="h-fit rounded-lg border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Order summary</h2>
      <div className="mt-5 divide-y">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3 py-4 first:pt-0">
            <div className="size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
              {item.imageUrl ? (
                // Product images come from backend-managed URLs that are not known at build time.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Package className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-foreground">{item.productName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.variantName ?? item.sku} x {item.quantity}
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                <Price
                  amountMinor={item.lineTotalMinor}
                  currency={cart.currency}
                  locale={cart.currency === 'VND' ? 'vi-VN' : 'en-US'}
                />
              </p>
            </div>
          </div>
        ))}
      </div>
      <dl className="mt-5 space-y-3 border-t pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Items</dt>
          <dd className="font-medium text-foreground">{itemCount}</dd>
        </div>
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
        <div className="flex items-center justify-between text-base">
          <dt className="font-semibold text-foreground">Total</dt>
          <dd className="font-semibold text-foreground">
            <Price
              amountMinor={cart.subtotalMinor}
              currency={cart.currency}
              locale={cart.currency === 'VND' ? 'vi-VN' : 'en-US'}
            />
          </dd>
        </div>
      </dl>
    </aside>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
  id: string;
  label: string;
}

function FormField({ children, className, error, id, label }: FormFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[34rem] w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}
