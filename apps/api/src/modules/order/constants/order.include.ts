import { Prisma } from '../../../generated/prisma/client';

export const orderInclude = {
  items: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} as const satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;
