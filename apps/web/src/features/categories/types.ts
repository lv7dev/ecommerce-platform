import type { Locale } from '@/features/products/types';
import type { ListQuery } from '@/shared/types/api';

export interface CategoryTranslation {
  description: string | null;
  id: string;
  locale: Locale;
  name: string;
  slug: string;
}

export interface CategorySummary {
  id: string;
  isActive: boolean;
  parentId: string | null;
  position: number;
  translations: CategoryTranslation[];
}

export interface Category extends CategorySummary {
  children: CategorySummary[];
  createdAt: string;
  parent: CategorySummary | null;
  productCount: number;
  updatedAt: string;
}

export interface CategoryListQuery extends ListQuery {
  isActive?: boolean;
  limit?: number;
  locale?: Locale;
  page?: number;
  parentId?: string;
  rootOnly?: boolean;
  sortBy?: 'position' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}
