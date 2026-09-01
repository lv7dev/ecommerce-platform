import { Prisma } from '../../../generated/prisma/client';

export const optionValueInclude = {
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
  _count: {
    select: {
      variants: true,
    },
  },
} as const satisfies Prisma.OptionValueInclude;

export type OptionValueWithRelations = Prisma.OptionValueGetPayload<{
  include: typeof optionValueInclude;
}>;
