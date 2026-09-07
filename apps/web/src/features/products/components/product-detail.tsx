'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CircleCheck, CircleX, Package } from 'lucide-react';
import { getApiErrorMessage } from '@/shared/api/errors';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ErrorState } from '@/shared/ui/error-state';
import { Price } from '@/shared/ui/price';
import { Skeleton } from '@/shared/ui/skeleton';
import { productBySlugQueryOptions } from '../queries';
import { getActivePrice, getLocalizedTranslation, getPrimaryVariant } from '../product-view';
import type {
  Currency,
  Locale,
  Product,
  ProductEmbeddedVariant,
  ProductVariantOptionValueSummary,
} from '../types';

const DEFAULT_LOCALE: Locale = 'vi';
const DEFAULT_CURRENCY: Currency = 'VND';

interface ProductDetailProps {
  slug: string;
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const productQuery = useQuery(productBySlugQueryOptions(DEFAULT_LOCALE, slug));
  const [userSelectedVariantId, setUserSelectedVariantId] = useState<string | null>(null);
  const product = productQuery.data;

  const fallbackVariant = useMemo(
    () => (product ? getPrimaryVariant(product.variants, DEFAULT_CURRENCY) : null),
    [product],
  );

  const userSelectedVariant = product?.variants.find(
    (variant) => variant.id === userSelectedVariantId,
  );
  const selectedVariant = userSelectedVariant ?? fallbackVariant;

  if (productQuery.isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (productQuery.isError) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState
          title="Product is unavailable"
          message={getApiErrorMessage(
            productQuery.error,
            'The product could not be loaded from the catalog.',
          )}
          onRetry={() => productQuery.refetch()}
        />
      </section>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <ProductDetailContent
      currency={DEFAULT_CURRENCY}
      locale={DEFAULT_LOCALE}
      product={product}
      selectedVariant={selectedVariant}
      onVariantSelect={setUserSelectedVariantId}
    />
  );
}

interface ProductDetailContentProps {
  currency: Currency;
  locale: Locale;
  onVariantSelect: (variantId: string) => void;
  product: Product;
  selectedVariant: ProductEmbeddedVariant | null;
}

function ProductDetailContent({
  currency,
  locale,
  onVariantSelect,
  product,
  selectedVariant,
}: ProductDetailContentProps) {
  const translation = getLocalizedTranslation(product.translations, locale);
  const price = selectedVariant ? getActivePrice(selectedVariant.prices, currency) : null;
  const categories = product.categories
    .map((category) => {
      return (
        category.translations.find((item) => item.locale === locale)?.name ??
        category.translations[0]?.name ??
        null
      );
    })
    .filter((category): category is string => Boolean(category));
  const isPurchasable =
    product.status === 'ACTIVE' &&
    Boolean(selectedVariant?.isActive) &&
    Boolean(price) &&
    (selectedVariant?.availableStock ?? 0) > 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 px-0">
        <Link href="/products">
          <ArrowLeft className="size-4" />
          Products
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] lg:items-start">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-muted">
            <div className="aspect-square">
              {selectedVariant?.imageUrl ? (
                // Product images come from backend-managed URLs that are not known at build time.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedVariant.imageUrl}
                  alt={translation?.name ?? selectedVariant.sku}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Package className="size-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {product.variants.some((variant) => variant.imageUrl) ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-label={`Select ${variant.sku}`}
                  aria-pressed={selectedVariant?.id === variant.id}
                  onClick={() => onVariantSelect(variant.id)}
                  className="aspect-square overflow-hidden rounded-md border bg-muted transition-colors hover:border-primary/60 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-ring"
                >
                  {variant.imageUrl ? (
                    // Product images come from backend-managed URLs that are not known at build time.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={variant.imageUrl}
                      alt={variant.sku}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <Package className="size-5 text-muted-foreground" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand ? <Badge variant="outline">{product.brand}</Badge> : null}
              {categories.slice(0, 2).map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                {translation?.name ?? product.brand ?? 'Untitled product'}
              </h1>
              {translation?.shortDescription ? (
                <p className="text-base leading-7 text-muted-foreground">
                  {translation.shortDescription}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Price
                amountMinor={price?.amountMinor ?? null}
                currency={price?.currency ?? currency}
                locale={locale === 'vi' ? 'vi-VN' : 'en-US'}
                className="text-2xl font-semibold"
              />
              {price?.compareAtAmountMinor ? (
                <p className="text-sm text-muted-foreground">
                  Compare at{' '}
                  <Price
                    amountMinor={price.compareAtAmountMinor}
                    currency={price.currency}
                    locale={locale === 'vi' ? 'vi-VN' : 'en-US'}
                    className="line-through"
                  />
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-foreground">Variant</h2>
              {selectedVariant ? (
                <p className="text-xs text-muted-foreground">SKU {selectedVariant.sku}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              {product.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={selectedVariant?.id === variant.id}
                  onClick={() => onVariantSelect(variant.id)}
                  className="flex min-h-16 items-center justify-between gap-4 rounded-md border bg-background px-4 py-3 text-left transition-colors hover:border-primary/60 aria-pressed:border-primary aria-pressed:bg-primary/5 aria-pressed:ring-2 aria-pressed:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {formatVariantName(product, variant, locale)}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {variant.availableStock > 0
                        ? `${variant.availableStock} in stock`
                        : 'Sold out'}
                    </span>
                  </span>
                  {variant.isActive ? (
                    <CircleCheck className="size-4 text-success" />
                  ) : (
                    <CircleX className="size-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <InventoryStat label="Available stock" value={selectedVariant?.availableStock ?? 0} />
            <InventoryStat label="Reserved stock" value={selectedVariant?.reservedStock ?? 0} />
            <InventoryStat label="Total stock" value={selectedVariant?.stock ?? 0} />
            <InventoryStat label="Status" value={isPurchasable ? 'Available' : 'Unavailable'} />
          </div>

          {translation?.description ? (
            <section className="space-y-3 border-t pt-6">
              <h2 className="text-sm font-medium text-foreground">Description</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {translation.description}
              </p>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

interface InventoryStatProps {
  label: string;
  value: number | string;
}

function InventoryStat({ label, value }: InventoryStatProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-10 w-28" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full" />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-36" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function formatVariantName(product: Product, variant: ProductEmbeddedVariant, locale: Locale) {
  const optionValues = sortOptionValues(product, variant.optionValues);

  if (!optionValues.length) {
    return variant.sku;
  }

  return optionValues
    .map((optionValue) => {
      const optionName = getOptionName(product, optionValue.optionCode, locale);
      const valueName =
        optionValue.translations.find((translation) => translation.locale === locale)?.value ??
        optionValue.translations[0]?.value ??
        optionValue.code;

      return `${optionName}: ${valueName}`;
    })
    .join(', ');
}

function sortOptionValues(product: Product, optionValues: ProductVariantOptionValueSummary[]) {
  return [...optionValues].sort((left, right) => {
    const leftIndex = product.options.findIndex((option) => option.code === left.optionCode);
    const rightIndex = product.options.findIndex((option) => option.code === right.optionCode);

    return normalizeOptionIndex(leftIndex) - normalizeOptionIndex(rightIndex);
  });
}

function normalizeOptionIndex(index: number) {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getOptionName(product: Product, optionCode: string, locale: Locale) {
  const option = product.options.find((item) => item.code === optionCode);

  return (
    option?.translations.find((translation) => translation.locale === locale)?.name ??
    option?.translations[0]?.name ??
    optionCode
  );
}
