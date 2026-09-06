import { ProductGridSkeleton } from '@/features/products/components/product-grid-skeleton';

export default function ProductsLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-4">
        <div className="h-5 w-32 rounded-md bg-muted" />
        <div className="h-10 w-64 rounded-md bg-muted" />
        <div className="h-6 w-full max-w-xl rounded-md bg-muted" />
      </div>
      <ProductGridSkeleton />
    </section>
  );
}
