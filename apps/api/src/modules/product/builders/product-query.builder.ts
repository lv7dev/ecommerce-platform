import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { FindProductsQueryDto } from '../dto/find-products-query.dto';
import { normalizeSearchText } from '../helpers/product-search.helper';

export function buildProductWhereInput(
  query: FindProductsQueryDto,
): Prisma.ProductWhereInput {
  const conditions: Prisma.ProductWhereInput[] = [];

  if (query.status) {
    conditions.push({ status: query.status });
  }

  if (query.locale) {
    conditions.push({
      translations: {
        some: {
          locale: query.locale,
        },
      },
    });
  }

  if (query.brand) {
    conditions.push({
      brand: {
        contains: query.brand,
        mode: 'insensitive',
      },
    });
  }

  if (query.categoryId) {
    conditions.push({
      categories: {
        some: {
          categoryId: query.categoryId,
        },
      },
    });
  }

  if (query.search) {
    conditions.push({
      searchDocuments: {
        some: {
          locale: query.locale,
          normalizedContent: {
            contains: normalizeSearchText(query.search),
          },
        },
      },
    });
  }

  if (
    query.currency ||
    query.minAmountMinor !== undefined ||
    query.maxAmountMinor !== undefined
  ) {
    conditions.push({
      variants: {
        some: {
          prices: {
            some: {
              currency: query.currency,
              isActive: true,
              amountMinor: buildAmountRange(
                query.minAmountMinor,
                query.maxAmountMinor,
              ),
            },
          },
        },
      },
    });
  }

  return conditions.length ? { AND: conditions } : {};
}

export function buildProductOrderByInput(
  query: FindProductsQueryDto,
): Prisma.ProductOrderByWithRelationInput {
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';

  return {
    [sortBy]: sortOrder,
  };
}

function buildAmountRange(
  minAmountMinor?: string,
  maxAmountMinor?: string,
): Prisma.BigIntFilter<'ProductVariantPrice'> | undefined {
  if (minAmountMinor !== undefined && !/^\d+$/.test(minAmountMinor)) {
    throw new BadRequestException('minAmountMinor must be a positive integer');
  }

  if (maxAmountMinor !== undefined && !/^\d+$/.test(maxAmountMinor)) {
    throw new BadRequestException('maxAmountMinor must be a positive integer');
  }

  if (minAmountMinor === undefined && maxAmountMinor === undefined) {
    return undefined;
  }

  return {
    gte: minAmountMinor === undefined ? undefined : BigInt(minAmountMinor),
    lte: maxAmountMinor === undefined ? undefined : BigInt(maxAmountMinor),
  };
}
