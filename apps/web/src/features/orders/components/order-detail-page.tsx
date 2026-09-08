'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, MapPin, Package, ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { getApiErrorMessage } from '@/shared/api/errors';
import { queryKeys } from '@/shared/query/keys';
import { Button } from '@/shared/ui/button';
import { ErrorState } from '@/shared/ui/error-state';
import { Price } from '@/shared/ui/price';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import { cancelOrder } from '../api';
import { orderQueryOptions } from '../queries';
import type { Order, ShippingAddress } from '../types';
import { OrderStatusBadge } from './order-status-badge';

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  return (
    <AuthGuard loadingFallback={<OrderDetailSkeleton />}>
      <OrderDetailContent orderId={orderId} />
    </AuthGuard>
  );
}

function OrderDetailContent({ orderId }: OrderDetailPageProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const orderQuery = useQuery(orderQueryOptions(orderId));
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, { reason: 'Customer cancelled before payment.' }),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      toast.showToast({
        description: `${order.orderNumber} has been cancelled.`,
        title: 'Order cancelled',
      });
    },
  });

  if (orderQuery.isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (orderQuery.isError) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title="Order is unavailable"
          message={getApiErrorMessage(orderQuery.error, 'We could not load this order.')}
          onRetry={() => orderQuery.refetch()}
        />
      </main>
    );
  }

  if (!orderQuery.data) {
    return null;
  }

  return (
    <OrderDetail
      order={orderQuery.data}
      isCancelling={cancelMutation.isPending}
      onCancel={() => cancelMutation.mutate()}
      cancelError={cancelMutation.error}
    />
  );
}

interface OrderDetailProps {
  cancelError: Error | null;
  isCancelling: boolean;
  onCancel: () => void;
  order: Order;
}

function OrderDetail({ cancelError, isCancelling, onCancel, order }: OrderDetailProps) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const canCancel = order.status === 'PENDING_PAYMENT' && order.paymentStatus === 'UNPAID';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Order detail</p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {order.orderNumber}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleString()} · {itemCount} item
            {itemCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/orders">
              <ArrowLeft className="size-4" />
              Orders
            </Link>
          </Button>
          {canCancel ? (
            <Button type="button" variant="destructive" disabled={isCancelling} onClick={onCancel}>
              <Ban className="size-4" />
              {isCancelling ? 'Cancelling...' : 'Cancel order'}
            </Button>
          ) : null}
        </div>
      </div>

      {cancelError ? (
        <p className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(cancelError, 'Unable to cancel order.')}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <ReceiptText className="size-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Items</h2>
            </div>
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_120px_140px] md:items-center"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
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
                        <Package className="size-7 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {item.productName}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">SKU {item.sku}</p>
                    {item.variantName ? (
                      <p className="mt-2 text-xs text-muted-foreground">{item.variantName}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      Unit{' '}
                      <Price
                        amountMinor={item.unitAmountMinor}
                        currency={order.currency}
                        locale={order.currency === 'VND' ? 'vi-VN' : 'en-US'}
                      />
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                <p className="text-sm font-semibold text-foreground">
                  <Price
                    amountMinor={item.lineTotalMinor}
                    currency={order.currency}
                    locale={order.currency === 'VND' ? 'vi-VN' : 'en-US'}
                  />
                </p>
              </article>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Status</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <OrderStatusBadge status={order.paymentStatus} />
              <OrderStatusBadge status={order.fulfillmentStatus} />
            </div>
            {order.expiresAt && order.status === 'PENDING_PAYMENT' ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Payment hold expires {new Date(order.expiresAt).toLocaleString()}.
              </p>
            ) : null}
            {order.cancelReason ? (
              <p className="mt-4 text-sm text-muted-foreground">{order.cancelReason}</p>
            ) : null}
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Shipping address</h2>
            </div>
            <ShippingAddressBlock address={order.shippingAddressSnapshot} />
          </section>

          <section className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <SummaryRow
                label="Subtotal"
                amountMinor={order.subtotalMinor}
                currency={order.currency}
              />
              <SummaryRow
                label="Discount"
                amountMinor={order.discountMinor}
                currency={order.currency}
              />
              <SummaryRow
                label="Shipping"
                amountMinor={order.shippingFeeMinor}
                currency={order.currency}
              />
              <SummaryRow label="Tax" amountMinor={order.taxMinor} currency={order.currency} />
              <div className="flex items-center justify-between border-t pt-3 text-base">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-semibold text-foreground">
                  <Price
                    amountMinor={order.totalMinor}
                    currency={order.currency}
                    locale={order.currency === 'VND' ? 'vi-VN' : 'en-US'}
                  />
                </dd>
              </div>
            </dl>
            {order.note ? (
              <p className="mt-5 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                {order.note}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}

function ShippingAddressBlock({ address }: { address: ShippingAddress | null }) {
  if (!address) {
    return <p className="text-sm text-muted-foreground">No shipping address recorded.</p>;
  }

  return (
    <address className="not-italic text-sm leading-6 text-muted-foreground">
      <p className="font-medium text-foreground">{address.fullName}</p>
      <p>{address.phone}</p>
      <p>{address.addressLine1}</p>
      {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
      <p>{[address.ward, address.district, address.province].filter(Boolean).join(', ')}</p>
      <p>{[address.postalCode, address.countryCode].filter(Boolean).join(' ')}</p>
    </address>
  );
}

function SummaryRow({
  amountMinor,
  currency,
  label,
}: {
  amountMinor: string;
  currency: string;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">
        <Price
          amountMinor={amountMinor}
          currency={currency}
          locale={currency === 'VND' ? 'vi-VN' : 'en-US'}
        />
      </dd>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[30rem] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </main>
  );
}
