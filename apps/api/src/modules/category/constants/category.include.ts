import { Prisma } from '../../../generated/prisma/client';

export const categoryInclude = {
  translations: {
    orderBy: {
      locale: 'asc',
    },
  },
  parent: {
    include: {
      translations: {
        orderBy: {
          locale: 'asc',
        },
      },
    },
  },
  children: {
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
  _count: {
    select: {
      products: true,
    },
  },
} as const satisfies Prisma.CategoryInclude;

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: typeof categoryInclude;
}>;
