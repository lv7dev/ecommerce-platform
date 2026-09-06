import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { getProduct, getProductBySlug, getProducts } from './api';
import type { Locale, ProductListQuery } from './types';

export function productsQueryOptions(query?: ProductListQuery) {
  return queryOptions({
    queryFn: () => getProducts(query),
    queryKey: queryKeys.products.list(query),
  });
}

export function productQueryOptions(idOrSlug: string) {
  return queryOptions({
    enabled: Boolean(idOrSlug),
    queryFn: () => getProduct(idOrSlug),
    queryKey: queryKeys.products.detail(idOrSlug),
  });
}

export function productBySlugQueryOptions(locale: Locale, slug: string) {
  return queryOptions({
    enabled: Boolean(slug),
    queryFn: () => getProductBySlug(locale, slug),
    queryKey: ['products', 'slug', locale, slug] as const,
  });
}
