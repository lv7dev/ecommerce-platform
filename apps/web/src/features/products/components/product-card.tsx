import Link from 'next/link';
import { Package, ShoppingCart } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Price } from '@/shared/ui/price';
import type { Currency, Locale, Product } from '../types';
import { toProductCardViewModel } from '../product-view';

interface ProductCardProps {
  currency?: Currency;
  locale?: Locale;
  product: Product;
}

export function ProductCard({ currency = 'VND', locale = 'vi', product }: ProductCardProps) {
  const productView = toProductCardViewModel(product, locale, currency);
  const isUnavailable = productView.availableStock <= 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary/40">
      <Link href={productView.href} className="block">
        <div className="aspect-square bg-muted">
          {productView.imageUrl ? (
            // Product images come from backend-managed URLs that are not known at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productView.imageUrl}
              alt={productView.name}
              className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Package className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {productView.brand ? <Badge variant="outline">{productView.brand}</Badge> : null}
            {productView.categories.slice(0, 1).map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
          <div className="space-y-1">
            <Link
              href={productView.href}
              className="line-clamp-2 text-base font-semibold hover:text-primary"
            >
              {productView.name}
            </Link>
            {productView.description ? (
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                {productView.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="space-y-1">
            <Price
              amountMinor={productView.priceAmountMinor}
              currency={productView.currency}
              locale={locale === 'vi' ? 'vi-VN' : 'en-US'}
              className="text-lg font-semibold"
            />
            <p className="text-xs text-muted-foreground">
              {productView.variantCount} variant{productView.variantCount === 1 ? '' : 's'}
            </p>
          </div>
          <Button size="sm" disabled={isUnavailable}>
            <ShoppingCart className="size-4" />
            {isUnavailable ? 'Sold out' : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  );
}
