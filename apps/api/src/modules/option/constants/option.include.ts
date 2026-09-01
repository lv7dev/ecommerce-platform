import { Prisma } from '../../../generated/prisma/client';

export const optionInclude = {
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
      _count: {
        select: {
          variants: true,
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
} as const satisfies Prisma.OptionInclude;

export type OptionWithRelations = Prisma.OptionGetPayload<{
  include: typeof optionInclude;
}>;
