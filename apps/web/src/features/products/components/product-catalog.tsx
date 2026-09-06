'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
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

type SortValue = 'createdAt-desc' | 'createdAt-asc' | 'updatedAt-desc' | 'brand-asc';

export function ProductCatalog() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [sort, setSort] = useState<SortValue>('createdAt-desc');

  const query = useMemo<ProductListQuery>(() => {
    const [sortBy, sortOrder] = sort.split('-') as [
      ProductListQuery['sortBy'],
      ProductListQuery['sortOrder'],
    ];

    return {
      currency: DEFAULT_CURRENCY,
      limit: PAGE_SIZE,
      locale: DEFAULT_LOCALE,
      page,
      search: submittedSearch || undefined,
      sortBy,
      sortOrder,
      status: 'ACTIVE',
    };
  }, [page, sort, submittedSearch]);

  const productsQuery = useQuery(productsQueryOptions(query));

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  }

  function handleSortChange(value: SortValue) {
    setPage(1);
    setSort(value);
  }

  const productList = productsQuery.data;

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

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1 gap-2 lg:w-80">
            <div className="min-w-0 flex-1">
              <Label htmlFor="product-search" className="sr-only">
                Search products
              </Label>
              <Input
                id="product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, SKU, category..."
              />
            </div>
            <Button type="submit" size="icon" aria-label="Search products">
              <Search className="size-4" />
            </Button>
          </form>

          <Select value={sort} onValueChange={(value) => handleSortChange(value as SortValue)}>
            <SelectTrigger className="w-full sm:w-48">
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
            locale={DEFAULT_LOCALE}
            currency={DEFAULT_CURRENCY}
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
