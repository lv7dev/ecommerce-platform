import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartMergePage } from '@/features/cart/components/cart-merge-page';
import { requireAuth } from '@/features/auth/server/require-auth';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
  title: 'Merge Cart | E-commerce Platform',
};

export default async function Page() {
  await requireAuth({ redirectTo: '/login?redirectTo=%2Fcart%2Fmerge' });

  return (
    <Suspense fallback={<CartMergePageSkeleton />}>
      <CartMergePage />
    </Suspense>
  );
}

function CartMergePageSkeleton() {
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
