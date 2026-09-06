import { apiRequest } from '@/shared/api/client';
import { apiEndpoints } from '@/shared/api/endpoints';
import type { PaginatedResult } from '@/shared/types/api';
import type { Product, ProductListQuery } from './types';

export type ProductListResult = PaginatedResult<Product>;

export function getProducts(query?: ProductListQuery) {
  return apiRequest<ProductListResult>(apiEndpoints.products.list, { query });
}

export function getProduct(id: string) {
  return apiRequest<Product>(apiEndpoints.products.detail(id));
}

export function getProductBySlug(locale: ProductListQuery['locale'], slug: string) {
  return apiRequest<Product>(apiEndpoints.products.slug(locale ?? 'vi', slug));
}
