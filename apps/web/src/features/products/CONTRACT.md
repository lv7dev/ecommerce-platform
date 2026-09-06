# Products API Contract

The frontend product catalog is wired to the backend `ProductController`.

## List Products

```text
GET /api/products
```

Supported query parameters:

- `page`: number, default `1`
- `limit`: number, default `20`, max `100`
- `locale`: `vi` or `en`
- `status`: `DRAFT`, `ACTIVE`, or `ARCHIVED`
- `brand`: string
- `search`: string
- `categoryId`: UUID
- `currency`: `VND` or `USD`
- `minAmountMinor`: numeric string
- `maxAmountMinor`: numeric string
- `sortBy`: `createdAt`, `updatedAt`, or `brand`
- `sortOrder`: `asc` or `desc`

Backend responses are wrapped by the global response interceptor:

```ts
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}
```

Product list data is flat-paginated:

```ts
interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Product Detail

```text
GET /api/products/:id
GET /api/products/slug/:locale/:slug
```

The catalog card uses localized translations and active variant prices from the
backend response. Prices are represented as `amountMinor` strings and formatted
by `Price`.
