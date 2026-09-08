'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Search } from 'lucide-react';
import { categoriesQueryOptions } from '@/features/categories/queries';
import type { Category } from '@/features/categories/types';
import { getApiErrorMessage } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { ErrorState } from '@/shared/ui/error-state';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { productsQueryOptions } from '../queries';
import type { Currency, Locale, ProductListQuery } from '../types';
import { ProductGrid } from './product-grid';
import { ProductGridSkeleton } from './product-grid-skeleton';

const DEFAULT_LOCALE: Locale = 'vi';
const DEFAULT_CURRENCY: Currency = 'VND';
const PAGE_SIZE = 12;
const ALL_CATEGORIES = 'all';

type SortValue = 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc' | 'brand-asc';

interface CatalogFilters {
  brand: string;
  categoryId: string;
  currency: Currency;
  locale: Locale;
  maxAmountMinor: string;
  minAmountMinor: string;
  search: string;
}

const DEFAULT_FILTERS: CatalogFilters = {
  brand: '',
  categoryId: ALL_CATEGORIES,
  currency: DEFAULT_CURRENCY,
  locale: DEFAULT_LOCALE,
  maxAmountMinor: '',
  minAmountMinor: '',
  search: '',
};

export function ProductCatalog() {
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortValue>('createdAt-desc');
  const categoriesQuery = useQuery(
    categoriesQueryOptions({
      isActive: true,
      limit: 100,
      locale: filters.locale,
      sortBy: 'position',
      sortOrder: 'asc',
    }),
  );

  const query = useMemo<ProductListQuery>(() => {
    const [sortBy, sortOrder] = sort.split('-') as [
      ProductListQuery['sortBy'],
      ProductListQuery['sortOrder'],
    ];

    return {
      brand: appliedFilters.brand.trim() || undefined,
      categoryId:
        appliedFilters.categoryId === ALL_CATEGORIES ? undefined : appliedFilters.categoryId,
      currency: appliedFilters.currency,
      limit: PAGE_SIZE,
      locale: appliedFilters.locale,
      maxAmountMinor: appliedFilters.maxAmountMinor.trim() || undefined,
      minAmountMinor: appliedFilters.minAmountMinor.trim() || undefined,
      page,
      search: appliedFilters.search.trim() || undefined,
      sortBy,
      sortOrder,
      status: 'ACTIVE',
    };
  }, [appliedFilters, page, sort]);

  const productsQuery = useQuery(productsQueryOptions(query));

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({
      ...filters,
      brand: filters.brand.trim(),
      maxAmountMinor: filters.maxAmountMinor.trim(),
      minAmountMinor: filters.minAmountMinor.trim(),
      search: filters.search.trim(),
    });
  }

  function handleFilterReset() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleSortChange(value: SortValue) {
    setPage(1);
    setSort(value);
  }

  const productList = productsQuery.data;
  const categories = categoriesQuery.data?.items ?? [];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-medium text-primary">Product Catalog</p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Browse products
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Search active products from the backend contract with locale, currency, sorting,
            loading, empty, and error states wired in.
          </p>
        </div>

        <div className="w-full lg:w-56">
          <Label htmlFor="product-sort" className="sr-only">
            Sort products
          </Label>
          <Select value={sort} onValueChange={(value) => handleSortChange(value as SortValue)}>
            <SelectTrigger id="product-sort">
              <SelectValue placeholder="Sort products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest</SelectItem>
              <SelectItem value="createdAt-asc">Oldest</SelectItem>
              <SelectItem value="updatedAt-desc">Recently updated</SelectItem>
              <SelectItem value="brand-asc">Brand A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="mb-8 grid gap-3 rounded-lg border bg-card p-4 shadow-sm lg:grid-cols-[minmax(180px,1fr)_160px_160px_160px_160px_160px_auto]"
      >
        <div className="min-w-0">
          <Label htmlFor="product-search" className="sr-only">
            Search products
          </Label>
          <Input
            id="product-search"
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
            placeholder="Search product, SKU, option..."
          />
        </div>

        <div>
          <Label htmlFor="product-brand" className="sr-only">
            Brand
          </Label>
          <Input
            id="product-brand"
            value={filters.brand}
            onChange={(event) =>
              setFilters((current) => ({ ...current, brand: event.target.value }))
            }
            placeholder="Brand"
          />
        </div>

        <Select
          value={filters.categoryId}
          onValueChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
        >
          <SelectTrigger aria-label="Category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {getCategoryName(category, filters.locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.locale}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, locale: value as Locale }))
          }
        >
          <SelectTrigger aria-label="Locale">
            <SelectValue placeholder="Locale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vi">Vietnamese</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.currency}
          onValueChange={(value) =>
            setFilters((current) => ({ ...current, currency: value as Currency }))
          }
        >
          <SelectTrigger aria-label="Currency">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VND">VND</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          <Label htmlFor="product-min-price" className="sr-only">
            Minimum price
          </Label>
          <Input
            id="product-min-price"
            inputMode="numeric"
            pattern="[0-9]*"
            value={filters.minAmountMinor}
            onChange={(event) =>
              setFilters((current) => ({ ...current, minAmountMinor: event.target.value }))
            }
            placeholder="Min"
          />
          <Label htmlFor="product-max-price" className="sr-only">
            Maximum price
          </Label>
          <Input
            id="product-max-price"
            inputMode="numeric"
            pattern="[0-9]*"
            value={filters.maxAmountMinor}
            onChange={(event) =>
              setFilters((current) => ({ ...current, maxAmountMinor: event.target.value }))
            }
            placeholder="Max"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1 lg:flex-none" aria-label="Apply product filters">
            <Search className="size-4" />
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Reset product filters"
            onClick={handleFilterReset}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </form>

      {categoriesQuery.isError ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Category filters are unavailable right now.
        </p>
      ) : null}

      {productsQuery.isLoading ? <ProductGridSkeleton /> : null}

      {productsQuery.isError ? (
        <ErrorState
          title="Products are unavailable"
          message={getApiErrorMessage(
            productsQuery.error,
            'Start the API server on port 4000, then retry loading the catalog.',
          )}
          onRetry={() => productsQuery.refetch()}
        />
      ) : null}

      {productList && !productsQuery.isLoading && !productsQuery.isError ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              Showing page {productList.page} of {Math.max(productList.totalPages, 1)}
            </p>
            <p>{productList.total} product results</p>
          </div>
          <ProductGrid
            products={productList.items}
            locale={appliedFilters.locale}
            currency={appliedFilters.currency}
          />
          {productList.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                {productList.page} / {productList.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= productList.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function getCategoryName(category: Category, locale: Locale) {
  return (
    category.translations.find((translation) => translation.locale === locale)?.name ??
    category.translations[0]?.name ??
    'Untitled category'
  );
}
