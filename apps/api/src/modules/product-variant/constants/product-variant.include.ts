import { Prisma } from '../../../generated/prisma/client';

export const productVariantInclude = {
  optionValues: {
    include: {
      optionValue: {
        include: {
          translations: {
            orderBy: {
              locale: 'asc',
            },
          },
          option: {
            include: {
              translations: {
                orderBy: {
                  locale: 'asc',
                },
              },
            },
          },
        },
      },
    },
  },
  prices: {
    orderBy: {
      currency: 'asc',
    },
  },
} as const satisfies Prisma.ProductVariantInclude;

export type ProductVariantWithRelations = Prisma.ProductVariantGetPayload<{
  include: typeof productVariantInclude;
}>;
