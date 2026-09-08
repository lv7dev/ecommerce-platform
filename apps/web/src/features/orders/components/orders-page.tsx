'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { getApiErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { Price } from '@/shared/ui/price';
import { Skeleton } from '@/shared/ui/skeleton';
import { ordersQueryOptions } from '../queries';
import type { Order } from '../types';
import { OrderStatusBadge } from './order-status-badge';

export function OrdersPage() {
  return (
    <AuthGuard loadingFallback={<OrdersSkeleton />}>
      <OrdersContent />
    </AuthGuard>
  );
}

function OrdersContent() {
  const ordersQuery = useQuery(ordersQueryOptions({ limit: 20, page: 1 }));

  if (ordersQuery.isLoading) {
    return <OrdersSkeleton />;
  }

  if (ordersQuery.isError) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title="Orders are unavailable"
          message={getApiErrorMessage(ordersQuery.error, 'We could not load your orders.')}
          onRetry={() => ordersQuery.refetch()}
        />
      </main>
    );
  }

  const orders = ordersQuery.data?.items ?? [];

  if (orders.length === 0) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-4">
          <EmptyState
            icon={PackageSearch}
            title="No orders yet"
            description="Your placed orders will appear here after checkout."
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
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Orders</p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Order history
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {ordersQuery.data?.total ?? orders.length} order
            {(ordersQuery.data?.total ?? orders.length) === 1 ? '' : 's'} placed.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_160px_150px_80px] gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-normal text-muted-foreground md:grid">
          <span>Order</span>
          <span>Status</span>
          <span>Total</span>
          <span className="text-right">Open</span>
        </div>
        <div className="divide-y">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      </section>
    </main>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="grid gap-4 px-4 py-4 transition-colors hover:bg-accent/50 md:grid-cols-[minmax(0,1fr)_160px_150px_80px] md:items-center"
    >
      <div className="min-w-0">
        <p className="font-medium text-foreground">{order.orderNumber}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(order.createdAt).toLocaleString()} · {itemCount} item
          {itemCount === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <OrderStatusBadge status={order.status} />
        <OrderStatusBadge status={order.fulfillmentStatus} />
      </div>
      <p className="font-semibold text-foreground">
        <Price
          amountMinor={order.totalMinor}
          currency={order.currency}
          locale={order.currency === 'VND' ? 'vi-VN' : 'en-US'}
        />
      </p>
      <div className="flex justify-end">
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

function OrdersSkeleton() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    </main>
  );
}
