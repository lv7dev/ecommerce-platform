import { PackageSearch } from 'lucide-react';
import { EmptyState } from '@/shared/ui/empty-state';
import type { Currency, Locale, Product } from '../types';
import { ProductCard } from './product-card';

interface ProductGridProps {
  currency?: Currency;
  locale?: Locale;
  products: Product[];
}

export function ProductGrid({ currency = 'VND', locale = 'vi', products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products found"
        description="Try changing the search keyword, price range, or sorting option."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} currency={currency} />
      ))}
    </div>
  );
}
