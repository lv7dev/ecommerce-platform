import { apiRequest } from '@/shared/api/client';
import { apiEndpoints } from '@/shared/api/endpoints';
import type { PaginatedResult } from '@/shared/types/api';
import type { Category, CategoryListQuery } from './types';

export type CategoryListResult = PaginatedResult<Category>;

export function getCategories(query?: CategoryListQuery) {
  return apiRequest<CategoryListResult>(apiEndpoints.categories.list, { query });
}
