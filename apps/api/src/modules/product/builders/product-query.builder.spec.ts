import { BadRequestException } from '@nestjs/common';
import {
  Currency,
  Locale,
  ProductStatus,
} from '../../../generated/prisma/client';
import {
  buildProductOrderByInput,
  buildProductWhereInput,
} from './product-query.builder';

describe('product query builder', () => {
  it('returns an empty where input when no filters are provided', () => {
    expect(buildProductWhereInput({})).toEqual({});
  });

  it('builds a combined where input for product catalog filters', () => {
    expect(
      buildProductWhereInput({
        brand: 'Luma',
        categoryId: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
        currency: Currency.VND,
        locale: Locale.vi,
        maxAmountMinor: '500000',
        minAmountMinor: '100000',
        search: 'Áo Đen!!',
        status: ProductStatus.ACTIVE,
      }),
    ).toEqual({
      AND: [
        { status: ProductStatus.ACTIVE },
        {
          translations: {
            some: {
              locale: Locale.vi,
            },
          },
        },
        {
          brand: {
            contains: 'Luma',
            mode: 'insensitive',
          },
        },
        {
          categories: {
            some: {
              categoryId: '018f4d7b-7ef3-4b77-9f35-05a34f968d7e',
            },
          },
        },
        {
          searchDocuments: {
            some: {
              locale: Locale.vi,
              normalizedContent: {
                contains: 'ao den',
              },
            },
          },
        },
        {
          variants: {
            some: {
              prices: {
                some: {
                  amountMinor: {
                    gte: BigInt(100000),
                    lte: BigInt(500000),
                  },
                  currency: Currency.VND,
                  isActive: true,
                },
              },
            },
          },
        },
      ],
    });
  });

  it('supports active price filters without a currency', () => {
    expect(
      buildProductWhereInput({
        minAmountMinor: '250000',
      }),
    ).toEqual({
      AND: [
        {
          variants: {
            some: {
              prices: {
                some: {
                  amountMinor: {
                    gte: BigInt(250000),
                    lte: undefined,
                  },
                  currency: undefined,
                  isActive: true,
                },
              },
            },
          },
        },
      ],
    });
  });

  it('rejects invalid price ranges before building Prisma filters', () => {
    expect(() =>
      buildProductWhereInput({
        minAmountMinor: '-1000',
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      buildProductWhereInput({
        maxAmountMinor: '12.5',
      }),
    ).toThrow(BadRequestException);
  });

  it('builds the requested order input and falls back to newest products', () => {
    expect(buildProductOrderByInput({})).toEqual({ createdAt: 'desc' });
    expect(
      buildProductOrderByInput({
        sortBy: 'brand',
        sortOrder: 'asc',
      }),
    ).toEqual({ brand: 'asc' });
  });
});
