export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    refresh: '/auth/refresh',
    register: '/auth/register',
  },
  cart: {
    items: '/cart/items',
    root: '/cart',
  },
  categories: {
    list: '/categories',
  },
  checkout: {
    root: '/orders/checkout',
  },
  products: {
    detail: (id: string) => `/products/${id}`,
    list: '/products',
    slug: (locale: string, slug: string) => `/products/slug/${locale}/${slug}`,
  },
} as const;
