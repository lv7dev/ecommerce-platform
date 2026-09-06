import type { ListQuery } from '@/shared/types/api';

export type Locale = 'vi' | 'en';

export type Currency = 'VND' | 'USD';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ProductTranslation {
  description: string | null;
  id: string;
  locale: Locale;
  name: string;
  shortDescription: string | null;
  slug: string;
}

export interface ProductEmbeddedCategoryTranslation {
  locale: Locale;
  name: string;
  slug: string;
}

export interface ProductEmbeddedCategory {
  id: string;
  isActive: boolean;
  parentId: string | null;
  position: number;
  translations: ProductEmbeddedCategoryTranslation[];
}

export interface ProductEmbeddedOptionTranslation {
  locale: Locale;
  name: string;
}

export interface ProductEmbeddedOptionValueTranslation {
  locale: Locale;
  value: string;
}

export interface ProductEmbeddedOptionValue {
  code: string;
  id: string;
  position: number;
  translations: ProductEmbeddedOptionValueTranslation[];
}

export interface ProductEmbeddedOption {
  code: string;
  id: string;
  position: number;
  translations: ProductEmbeddedOptionTranslation[];
  values: ProductEmbeddedOptionValue[];
}

export interface ProductVariantOptionValueSummary {
  code: string;
  id: string;
  optionCode: string;
  translations: ProductEmbeddedOptionValueTranslation[];
}

export interface ProductVariantPriceSummary {
  amountMinor: string;
  compareAtAmountMinor: string | null;
  currency: Currency;
  endsAt: string | null;
  id: string;
  isActive: boolean;
  startsAt: string | null;
}

export interface ProductEmbeddedVariant {
  availableStock: number;
  barcode: string | null;
  createdAt: string;
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  optionValues: ProductVariantOptionValueSummary[];
  prices: ProductVariantPriceSummary[];
  reservedStock: number;
  sku: string;
  stock: number;
  updatedAt: string;
}

export interface Product {
  brand: string | null;
  categories: ProductEmbeddedCategory[];
  createdAt: string;
  id: string;
  options: ProductEmbeddedOption[];
  status: ProductStatus;
  translations: ProductTranslation[];
  updatedAt: string;
  variants: ProductEmbeddedVariant[];
}

export interface ProductListQuery extends ListQuery {
  brand?: string;
  categoryId?: string;
  currency?: Currency;
  limit?: number;
  locale?: Locale;
  maxAmountMinor?: string;
  minAmountMinor?: string;
  page?: number;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'brand';
  sortOrder?: 'asc' | 'desc';
  status?: ProductStatus;
}
