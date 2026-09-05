import { Prisma } from '../../../generated/prisma/client';

export const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              translations: {
                orderBy: {
                  locale: 'asc',
                },
              },
            },
          },
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
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const satisfies Prisma.CartInclude;

export type CartWithRelations = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

export type CartItemWithRelations = CartWithRelations['items'][number];
