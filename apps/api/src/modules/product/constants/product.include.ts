import { Prisma } from '../../../generated/prisma/client';

export const productInclude = {
  translations: {
    orderBy: {
      locale: 'asc',
    },
  },
  categories: {
    include: {
      category: {
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
  options: {
    include: {
      option: {
        include: {
          translations: {
            orderBy: {
              locale: 'asc',
            },
          },
          values: {
            include: {
              translations: {
                orderBy: {
                  locale: 'asc',
                },
              },
            },
            orderBy: {
              position: 'asc',
            },
          },
        },
      },
    },
    orderBy: {
      position: 'asc',
    },
  },
  variants: {
    include: {
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
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;
