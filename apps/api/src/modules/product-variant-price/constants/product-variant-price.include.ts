import { Prisma } from '../../../generated/prisma/client';

export const productVariantPriceInclude = {
  variant: {
    select: {
      id: true,
      productId: true,
      sku: true,
    },
  },
} as const satisfies Prisma.ProductVariantPriceInclude;

export type ProductVariantPriceWithRelations =
  Prisma.ProductVariantPriceGetPayload<{
    include: typeof productVariantPriceInclude;
  }>;
