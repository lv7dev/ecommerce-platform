import type { ListQuery } from '@/shared/types/api';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  cart: {
    detail: ['cart'] as const,
  },
  categories: {
    list: (query?: ListQuery) => ['categories', 'list', query ?? {}] as const,
  },
  products: {
    detail: (idOrSlug: string) => ['products', 'detail', idOrSlug] as const,
    list: (query?: ListQuery) => ['products', 'list', query ?? {}] as const,
  },
} as const;
